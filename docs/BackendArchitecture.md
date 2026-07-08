# Backend Architecture

## Framework

NestJS 11 with Express platform, TypeScript, SWC compiler, and Prisma 7 ORM.

## Module Inventory

### Infrastructure Modules

| Module | Responsibility |
|--------|---------------|
| `PrismaModule` | Global module (`@Global()`) providing `PrismaService` — wraps PrismaClient with PostgreSQL adapter and connection pooling |
| `GatewayModule` | Global module (`@Global()`) providing `AppGateway` — Socket.IO server with Clerk JWT auth on connect, user→socket mapping |
| `AuthModule` | Provides `ClerkAuthGuard` — JWT verification guard using `@clerk/backend`'s `verifyToken()` |
| `CommonModule` | Provides `ProjectRoleGuard` and `@ProjectRoles()` decorator — role-based access control |
| `LiveblocksModule` | Liveblocks SDK integration — auth endpoint (per-room session grants), webhook handler |

### Domain Modules

| Module | Responsibility | Key Endpoints |
|--------|---------------|---------------|
| `UsersModule` | User CRUD, Clerk sync, profile management, online status | `POST /users/sync`, `GET /users/me`, `PATCH /users/me`, `POST /users/me/online` |
| `ProjectModule` | Full project lifecycle + notifications on changes | `GET /project`, `POST /project`, `PATCH /project/:id`, `POST /project/:id/transfer-ownership` |
| `PageModule` | Page CRUD within a project, role checking | `GET /project/:id/pages`, `POST /project/:id/pages`, `GET /project/:id/pages/:pageId/my-role` |
| `NodesModule` | Canvas node persistence, Liveblocks webhook handler | `GET /pages/:pageId/nodes`, `POST /pages/:pageId/nodes`, `POST /webhooks/liveblocks` |
| `NotificationsModule` | Notification CRUD, socket-pushed real-time updates | `GET /notifications`, `PATCH /notifications/:id/read`, `GET /notifications/unread-count` |
| `AccessRequestsModule` | Request/approve/deny project access with event history | `POST /access-requests`, `PATCH /access-requests/:id/respond`, `GET /access-requests/project/:projectId/pending` |
| `InvitationsModule` | Invite by email/user/link, token management | `POST /projects/:projectId/invite/email`, `GET /invitations/:token` |
| `AccessModule` | Unified Access Center (aggregates invitations + requests) | `GET /access/incoming`, `GET /access/outgoing`, `GET /access/history` |
| `DashboardModule` | Aggregated dashboard queries | `GET /dashboard` |
| `SearchModule` | Cross-project search | `GET /search/global` |
| `ProjectMembersModule` | Member listing, role management | `GET /projects/:projectId/members`, `PATCH /projects/:projectId/members/:userId/role` |

## Guard Pipeline

Routes are protected by a two-layer guard system:

```
Incoming Request
    │
    ▼
ClerkAuthGuard
├── Extracts token from:
│   ├── Authorization: Bearer <jwt>
│   └── __session cookie (fallback)
├── Calls verifyToken(token, { secretKey })
├── Sets req['userId'] = payload.sub
└── Throws UnauthorizedException on failure
    │
    ▼
ProjectRoleGuard (optional, applied per-route)
├── Reads @ProjectRoles('owner', 'editor') metadata
├── Resolves projectId from route params or page lookup
├── Checks: owner bypass (always allowed for project owner)
├── Checks: ProjectMember record with role hierarchy
│   (owner=3, editor=2, viewer=1)
├── Sets req['projectRole'] = member.role
└── Throws ForbiddenException if insufficient role
```

## Gateway (Socket.IO)

The `AppGateway` is a `@Global()` WebSocket gateway:

- **Authentication**: Verifies Clerk JWT from `handshake.auth.token` on connection — disconnects if invalid
- **User→Socket mapping**: Maintains `Map<userId, Set<socketId>>` for targeted event delivery
- **Connection tracking**: Handles connect/disconnect to keep the map current
- **Methods**:
  - `notifyUser(userId, event, payload)` — sends to all sockets of a specific user
  - `broadcastToAll(event, payload)` — sends to all connected clients
  - `broadcastToCollaborators(userId, event, payload)` — sends to all of a user's own sockets

## Data Flow Patterns

### Standard REST Flow
```
Client → Controller → Service → PrismaService → PostgreSQL
                              ↕
                         AppGateway (for notifications)
```

### Webhook Flow
```
Liveblocks Cloud → POST /webhooks/liveblocks → NodesController
    │                                                 │
    │ (storageUpdated event)                          ▼
    │                                          NodesService
    │                                     saveNodesFromWebhook()
    │                                                 │
    │                                                 ▼
    │                                          PrismaService
    │                                     Node deleteMany + createMany
    │                                                 │
    │                                                 ▼
    │                                           PostgreSQL
```

## Module Dependencies

```
PrismaModule (@Global) ─────────────────────────────────────┐
GatewayModule (@Global) ───────────────────────────────┐    │
                                                       │    │
LiveblocksModule ──→ PrismaModule                       │    │
ProjectModule ──→ PrismaModule, NotificationsModule      │    │
NotificationsModule ──→ PrismaModule, GatewayModule      │    │
AccessRequestsModule ──→ GatewayModule, NotificationsModule, PrismaModule
InvitationsModule ──→ PrismaModule, GatewayModule, NotificationsModule
AccessModule ──→ PrismaModule, InvitationsModule, AccessRequestsModule
UsersModule ──→ PrismaModule, GatewayModule              │    │
NodesModule ──→ LiveblocksModule, PrismaModule            │    │
DashboardModule ──→ PrismaModule                          │    │
SearchModule ──→ PrismaModule                              │    │
ProjectMembersModule ──→ PrismaModule                      │    │
PageModule ──→ PrismaModule                                │    │
                                                           ▼    ▼
                                                   (injectable anywhere
                                                    via @Global)
```

## Key Design Patterns

### Transaction-based Operations
Critical operations use Prisma `$transaction`:
- Project creation (create project + create owner membership)
- Ownership transfer (update project owner + demote old owner + promote new owner)
- Access request approval (update request + create event + create member)
- Invitation acceptance (create member + update invitation)
- Page deletion (delete page + reorder remaining pages)

### Aggregation Pattern
The `AccessModule` and `DashboardModule` demonstrate an aggregation pattern where data from multiple domains is combined:
- Access: merges invitations + access requests into unified incoming/outgoing/history views
- Dashboard: parallelized queries for projects, members, pending requests, recent activity

### Notification Broadcasting
Many service operations follow a "do + notify" pattern:
1. Perform the database operation
2. Create a notification record
3. Push to connected user via `AppGateway.notifyUser()`
