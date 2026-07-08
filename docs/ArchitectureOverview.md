# Architecture Overview

## What is CanvasFlow?

CanvasFlow is a real-time collaborative design canvas tool that enables multiple users to edit the same canvas simultaneously. It supports shape creation, text editing, layer management, and provides a full suite of design tools with live cursors, presence indicators, and instant synchronization.

## Primary Features

- **Real-time collaborative canvas editing** — multiple users edit simultaneously with live cursors and presence
- **Shape tools** — rectangles, circles, lines, arrows, text, images, stars, diamonds, and more (18 shape types)
- **Layer management** — hierarchical parent-child layers with drag-and-drop reordering
- **Undo/redo** — full history stack per editing session with save points
- **Alignment & distribution** — align left/right/center/top/bottom, distribute horizontally/vertically
- **Grid snapping & smart guides** — snap to grid, smart alignment guides
- **Role-based access control** — owner / editor / viewer per project
- **Access management** — invite by email or user ID, request access, approve/deny workflow
- **Notifications** — real-time push for access requests, invitations, and project changes
- **Pages** — multiple pages per project with role inheritance
- **Project management** — create, archive, favorite, pin, transfer ownership
- **Search** — global cross-project search
- **Dashboard** — aggregated view of projects, collaborators, recent activity

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                    │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Next.js 15.5 App                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │ │
│  │  │Liveblocks│ │Socket.IO │ │  Axios HTTP      │ │ │
│  │  │ Client   │ │ Client   │ │  Client (useApi) │ │ │
│  │  └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │ │
│  └───────┼─────────────┼────────────────┼───────────┘ │
└──────────┼─────────────┼────────────────┼─────────────┘
           │             │                │
           │             │                │
┌──────────┼─────────────┼────────────────┼─────────────┐
│          │    Liveblocks Cloud           │             │
│          │    (CRDT Sync)               │             │
│          └──────────────┬────────────────┘             │
│                         │ webhooks                     │
│           ┌─────────────┼────────────────────────────┐  │
│           │             │                            │  │
│           │    ┌────────▼────────┐                   │  │
│           │    │  NestJS 11 API   │                   │  │
│           │    │  (Express)      │                   │  │
│           │    └─────────────────┘                   │  │
│           │         │                                │  │
│           │    ┌────▼────┐                           │  │
│           │    │ Prisma  │                           │  │
│           │    │ ORM     │                           │  │
│           │    └────┬────┘                           │  │
│           │         │                                │  │
│           │    ┌────▼────┐                           │  │
│           │    │PostgreSQL│                          │  │
│           │    └─────────┘                           │  │
│           │                                          │  │
│           │    ┌──────────────────┐                  │  │
│           │    │  Clerk Backend   │                  │  │
│           │    │  (JWT Verify)   │                  │  │
│           │    └──────────────────┘                  │  │
│           └──────────────────────────────────────────┘  │
│                     Render (Hosting)                    │
└─────────────────────────────────────────────────────────┘

           ┌──────────────────────────┐
           │     Clerk Cloud          │
           │  (Auth UI + JWT)         │
           └──────────────────────────┘
```

## Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15.5 | React framework with App Router |
| Rendering | React 19.1 | UI library |
| Canvas | Konva 10 + react-konva 19 | HTML5 Canvas rendering |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| UI Components | Radix UI + shadcn/ui | Accessible UI primitives |
| Icons | Lucide React | Icon library |
| Backend | NestJS 11 | Node.js framework (Express) |
| ORM | Prisma 7.7 | Database ORM for PostgreSQL |
| Auth | Clerk | External identity provider (JWT) |
| Real-time (canvas) | Liveblocks 3.18 | CRDT-based collaborative storage |
| Real-time (events) | Socket.IO 4.8 | WebSocket event delivery |
| HTTP | Axios | HTTP client with retry interceptor |
| State (server) | SWR | Data fetching / caching |
| Toasts | Sonner | Toast notifications |
| Animations | Motion (Framer Motion) | UI animations |
| API docs | Swagger / OpenAPI | API documentation |

## Design Decisions

### Why Konva over SVG (react-konva over @xyflow/react)
The canvas rendering uses Konva, an HTML5 Canvas library, rather than SVG. This was chosen for:
- **Performance**: Canvas scales better with hundreds/thousands of nodes compared to SVG's DOM-based approach
- **Layer compositing**: Konva's stage/layer model maps cleanly to z-index layering
- **Transformer**: Built-in interactive transform controls (resize, rotate) out of the box
- **Event model**: Konva's event delegation over the canvas avoids per-node DOM listeners

### Why Liveblocks + Socket.IO (two real-time channels)
The architecture uses two separate real-time channels rather than one:
- **Liveblocks** handles canvas data synchronization (CRDT-based Storage + Presence) — it manages conflict resolution, history, and state synchronization automatically
- **Socket.IO** handles notifications, invitations, access requests, and user online status — lightweight event delivery that doesn't need CRDT semantics

This separation prevents canvas operations from being blocked by server-side processing and avoids coupling collaboration to notification delivery.

### Why NestJS over Express/Fastify
NestJS was chosen for:
- **Module system**: Domain-based module organization mirrors the business domains
- **Guard pipeline**: Decorator-based auth guards (`ClerkAuthGuard` + `ProjectRoleGuard`) cleanly separate concerns
- **Dependency injection**: Built-in DI simplifies service composition
- **WebSocket integration**: First-class Socket.IO support via `@nestjs/websockets`
- **Swagger**: Auto-generated API documentation via `@nestjs/swagger`

### Why Prisma over TypeORM/Drizzle
Prisma was chosen for:
- **Type safety**: Generated TypeScript types from the schema
- **Migration system**: Prisma Migrate for schema versioning
- **Query optimization**: Built-in pagination, filtering, and relation loading
- **Adapter pattern**: `@prisma/adapter-pg` for connection pooling with `pg` driver

### Why Clerk over Auth0/Firebase Auth
Clerk was chosen for:
- **Frontend + Backend SDK**: Unified auth across the stack with `@clerk/nextjs` and `@clerk/backend`
- **Middleware**: Native Next.js middleware support for route protection
- **JWT verification**: Simple `verifyToken()` API for backend guard
- **User management**: Built-in user profile UI components (`UserButton`, etc.)

## System Communication

1. **Client → API (REST)**: HTTP requests via Axios with Clerk JWT in `Authorization` header
2. **Client → Liveblocks (WebSocket)**: Direct WebSocket connection to Liveblocks Cloud for canvas sync
3. **Client → Backend (Socket.IO)**: WebSocket connection for real-time events (notifications, invites)
4. **Liveblocks → Backend (Webhook)**: `storageUpdated` events sent to `POST /webhooks/liveblocks` for persistence
5. **Backend → Client (Socket.IO)**: Server pushes events to connected clients via Gateway
6. **Frontend → Clerk**: User authentication/session management
7. **Backend → Clerk**: JWT token verification
