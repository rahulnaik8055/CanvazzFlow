# Folder Structure

## Top Level

```
design-code/
├── backend/          # NestJS API server
├── frontend/         # Next.js application
├── docs/             # Architecture documentation
├── .summary.md       # Session notes
└── README.md         # Project overview
```

## Backend (`backend/`)

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema (10 models, 7 enums)
├── src/
│   ├── main.ts                # NestJS bootstrap, Swagger, CORS, rawBody
│   ├── app.module.ts          # Root module (imports all feature modules)
│   ├── app.controller.ts      # Health check endpoint
│   ├── app.service.ts         # Health check service
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts   # Global Prisma module
│   │   └── prisma.service.ts  # PrismaClient wrapper (Pg adapter, connection pool)
│   │
│   ├── auth/
│   │   └── clerk.guard.ts     # JWT verification guard using @clerk/backend
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   └── project-role.decorator.ts  # @ProjectRoles() decorator
│   │   └── guards/
│   │       └── project-role.guard.ts      # Role-based access guard
│   │
│   ├── gateway/
│   │   ├── app.gateway.ts     # Socket.IO server (auth, user→socket mapping)
│   │   └── gateway.module.ts  # @Global() module exporting AppGateway
│   │
│   ├── liveblocks/
│   │   ├── liveblocks.module.ts
│   │   ├── liveblocks.service.ts   # Liveblocks SDK + webhook verification
│   │   └── liveblocks.controller.ts  # POST /liveblocks/auth
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts     # User CRUD, sync, profile, online status
│   │   ├── users.service.ts        # Business logic
│   │   └── dto/
│   │       ├── update-profile.dto.ts
│   │       └── update-privacy.dto.ts
│   │
│   ├── project/
│   │   ├── project.module.ts
│   │   ├── project.controller.ts   # Project CRUD, favorites, archive, pin
│   │   └── project.service.ts      # Business logic + notifications
│   │
│   ├── page/
│   │   ├── page.module.ts
│   │   ├── page.controller.ts      # Page CRUD, role lookup
│   │   └── page.service.ts
│   │
│   ├── nodes/
│   │   ├── nodes.module.ts
│   │   ├── nodes.controller.ts     # Node CRUD + Liveblocks webhook handler
│   │   └── nodes.service.ts        # Persistence + webhook processing
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts  # CRUD, read/unread, pagination
│   │   └── notifications.service.ts     # Business logic + socket pushes
│   │
│   ├── access-requests/
│   │   ├── access-requests.module.ts
│   │   ├── access-requests.controller.ts  # Request/respond/cancel/bulk
│   │   └── access-requests.service.ts     # Workflow + notifications
│   │
│   ├── invitations/
│   │   ├── invitations.module.ts
│   │   ├── invitations.controller.ts  # Invite by email/user/link
│   │   └── invitations.service.ts     # Business logic + token generation
│   │
│   ├── access/
│   │   ├── access.module.ts
│   │   ├── access.controller.ts   # Unified Access Center endpoints
│   │   └── access.service.ts      # Aggregates invitations + requests
│   │
│   ├── dashboard/
│   │   ├── dashboard.module.ts
│   │   ├── dashboard.controller.ts  # Dashboard data
│   │   └── dashboard.service.ts     # Aggregated queries
│   │
│   ├── search/
│   │   ├── search.module.ts
│   │   ├── search.controller.ts     # Global search
│   │   └── search.service.ts
│   │
│   └── project-members/
│       ├── project-members.module.ts
│       ├── project-members.controller.ts  # Member list, role management
│       └── project-members.service.ts
│
├── test/                   # E2E tests
├── generated/              # Prisma-generated client output
├── dist/                   # Compiled JS output
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Backend Module Coupling

Each module is self-contained with its own controller, service, and module file. The dependency graph:

```
app.module
├── PrismaModule (@Global)
├── GatewayModule (@Global)
├── LiveblocksModule → PrismaModule
├── AuthModule
├── UsersModule → PrismaModule, GatewayModule
├── ProjectModule → PrismaModule, NotificationsModule
├── PageModule → PrismaModule
├── NodesModule → LiveblocksModule, PrismaModule
├── NotificationsModule → PrismaModule, GatewayModule
├── AccessRequestsModule → GatewayModule, NotificationsModule, PrismaModule
├── InvitationsModule → PrismaModule, GatewayModule, NotificationsModule
├── AccessModule → PrismaModule, InvitationsModule, AccessRequestsModule
├── DashboardModule → PrismaModule
├── SearchModule → PrismaModule
├── ProjectMembersModule → PrismaModule
└── AppController
```

## Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── middleware.ts              # Clerk auth middleware + route protection
│   ├── liveblocks.config.ts       # Liveblocks client + auth endpoint
│   │
│   ├── app/
│   │   ├── layout.tsx             # Root layout (ClerkProvider, Toaster, fonts)
│   │   ├── Providers.tsx          # ErrorBoundary wrapper
│   │   ├── page.tsx               # Landing page
│   │   ├── globals.css            # Tailwind imports
│   │   ├── loading.tsx            # Global loading state
│   │   ├── error.tsx              # Global error state
│   │   │
│   │   ├── (main)/                # Authenticated route group
│   │   │   ├── layout.tsx         # Sidebar + NotificationProvider + ErrorBoundary
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── project/page.tsx
│   │   │   ├── project/[id]/pages/page.tsx
│   │   │   ├── project/[id]/settings/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── profile/[userId]/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── access/page.tsx
│   │   │   ├── requests/page.tsx
│   │   │   └── invitations/page.tsx
│   │   │
│   │   ├── (editor)/              # Editor route group
│   │   │   ├── layout.tsx         # NotificationProvider wrapper
│   │   │   └── editor/[projectId]/page/[pageId]/page.tsx  # Main editor
│   │   │
│   │   ├── invitations/[token]/page.tsx  # Public invitation page
│   │   └── sync/page.tsx          # Post-auth user sync
│   │
│   ├── components/
│   │   ├── ui/                    # 23 shadcn primitives (button, card, dialog, etc.)
│   │   ├── common/                # Navbar, ErrorBoundary, LoadingState, OfflineBanner
│   │   ├── dashboard/             # 11 dashboard widgets
│   │   ├── editor/                # CollaboratorCursors.tsx
│   │   ├── landing/               # Landing page sections
│   │   ├── notifications/         # NotificationBell, notification-context
│   │   ├── access/                # Access/invitation management UI
│   │   ├── requests/              # RequestAccessModal
│   │   ├── project/               # Project-related UI
│   │   ├── invitations/           # Invitation UI
│   │   ├── search/                # Search UI
│   │   ├── profile/               # Profile UI
│   │   ├── layout/                # PageShell, PageHeader
│   │   ├── custom/                # EmptyState, SearchBar, SkeletonGrid
│   │   ├── CanvasArea.tsx         # Main canvas rendering
│   │   ├── TopToolbar.tsx         # Top toolbar (tools, members, zoom)
│   │   ├── LeftSidebar.tsx        # Left sidebar (Insert, Layers, Pages)
│   │   ├── InspectorPanel.tsx     # Right property panel
│   │   ├── NodeRenderer.tsx       # Konva node rendering
│   │   ├── LayersPanel.tsx        # Layer list with drag-and-drop
│   │   ├── InsertPanel.tsx        # Shape insertion panel
│   │   ├── CollaboratorAvatars.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── ColorPicker.tsx
│   │   └── LoadingOverlay.tsx
│   │
│   ├── hooks/                     # 25 custom hooks
│   │   ├── useCanvasHistory.ts    # Undo/redo stack
│   │   ├── useCanvasInteractions.ts  # Mouse, transform, selection
│   │   ├── useShapeActions.ts     # Add, delete, arrange, lock
│   │   ├── useSnapping.ts         # Grid snap + smart guides
│   │   ├── useAlignment.ts        # Align/distribute
│   │   ├── useViewControl.ts      # Zoom/pan
│   │   ├── useSocket.ts           # Socket.IO client
│   │   ├── useSyncEngine.ts       # Debounced mutation queue
│   │   ├── useIdleDetection.ts    # User idle state
│   │   ├── useOnlineStatus.ts     # Browser online/offline
│   │   ├── useCollaboratorUpdates.ts  # Real-time profile changes
│   │   ├── useDashboard.ts        # Dashboard data
│   │   ├── useNotifications.ts    # Paginated notifications
│   │   ├── useProjectRole.ts      # SWR role fetching
│   │   ├── useAccess.ts / useAccessRequests.ts / useAccessRequestsManagement.ts
│   │   ├── useInvitations.ts / useMyRequests.ts
│   │   ├── useMyProjects.ts / useProjectSearch.ts / useUniversalSearch.ts
│   │   ├── useProfile.ts
│   │   └── useDebounce.ts / useDebounceSave.ts
│   │
│   ├── lib/
│   │   ├── api.ts                 # useApi hook (axios + Clerk auth)
│   │   ├── http-client.ts         # Axios instance with retry interceptor
│   │   ├── presence.ts            # getUserColor utility
│   │   └── notificationUtils.ts   # timeAgo formatter
│   │
│   └── types/
│       └── CanvasTypes.ts         # Node interface (18 shape types)
│
├── components.json                # shadcn/ui configuration
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## Key Architectural Observations

### Strengths
- **Clear separation of concerns**: Backend follows module-per-domain pattern; frontend separates pages, components, and hooks
- **Consistent naming conventions**: Controllers → Services → Prisma in backend; hooks prefixed with `use` in frontend
- **Minimal coupling**: Modules depend on PrismaModule and GatewayModule (both @Global), avoiding circular imports
- **Feature isolation**: Each business domain lives in its own module with self-contained controller/service/module files

### Weaknesses
- **No shared types package**: Frontend `CanvasTypes.ts` and backend Prisma types are independent — no shared contract between client and server
- **Mixed concerns in LeftSidebar**: Combines InsertPanel, LayersPanel, and PagesPanel — would benefit from separation
- **No API client codegen**: Frontend manually constructs API calls rather than using generated clients from OpenAPI spec
- **Test coverage is thin**: Spec files exist but only test that controllers/services are defined (no business logic tests)
- **No error boundary per feature**: Single global ErrorBoundary catches all errors without granular recovery
