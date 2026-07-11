

https://github.com/user-attachments/assets/e00ad474-5b54-4787-8512-8e7888bdba28





# CanvazzFlow

A real-time collaborative design canvas — multiple users editing the same board simultaneously, with live cursors, presence, shape tools, and instant sync. Think a lightweight Figma.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![React](https://img.shields.io/badge/React-19.1-61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E)
![Prisma](https://img.shields.io/badge/Prisma-7.7-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-336791)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Real-time collaborative editing** — live cursors, presence, and instant sync across users
- **18 shape types** — rectangles, circles, lines, arrows, text, images, stars, diamonds, sticky notes, code blocks, and more
- **Layer management** — hierarchical parent-child layers with drag-and-drop reordering
- **Undo/redo** — full history stack per session with save points
- **Alignment & distribution** — align and distribute shapes precisely
- **Grid snapping & smart guides**
- **Role-based access control** — owner / editor / viewer per project
- **Access management** — invite by email or user ID, request access, approve/deny workflow
- **Real-time notifications** — access requests, invitations, project changes
- **Multi-page projects** with role inheritance
- **Project management** — create, archive, favorite, pin, transfer ownership
- **Global search** across projects
- **Dashboard** — aggregated view of projects, collaborators, recent activity

---

## Demo

<!--
  Drop your demo video here. A few options that render well on GitHub / GitLab:

  1. Direct upload (GitHub only): drag the video file into a README edit box on GitHub.com —
     it uploads to user-attachments and gives you a URL. Paste that URL on its own line, e.g.:

     https://github.com/user-attachments/assets/your-video-id

  2. Thumbnail linking to a hosted video (works everywhere, incl. this file):

     [![CanvasFlow demo](docs/demo-thumbnail.png)](https://youtu.be/your-video-id)

  3. GIF preview inline (autoplays, no click needed):

     ![CanvasFlow demo](docs/demo.gif)
-->

[![CanvasFlow demo](docs/demo-thumbnail.png)](https://youtu.be/REPLACE-WITH-VIDEO-ID)

*Click the thumbnail above to watch a full walkthrough — real-time editing, layers, and access control in action.*

---

## Architecture

```mermaid
graph TD
    subgraph Client["Browser — Next.js 15 App"]
        LC[Liveblocks Client]
        SC[Socket.IO Client]
        AX[Axios HTTP Client]
    end

    subgraph LB["Liveblocks Cloud"]
        CRDT[CRDT Sync / Storage]
    end

    subgraph Backend["Render — NestJS 11 API"]
        API[Controllers / Services]
        PR[Prisma ORM]
        DB[(PostgreSQL)]
        CG[Clerk Backend — JWT Verify]
    end

    subgraph Auth["Clerk Cloud"]
        CA[Auth UI + JWT Issuer]
    end

    LC -- WebSocket sync --> CRDT
    CRDT -- webhook: storageUpdated --> API
    SC -- WebSocket events --> API
    AX -- REST + JWT --> API
    API --> PR --> DB
    API --> CG
    LC -. auth request .-> CA
    AX -. session / JWT .-> CA
```

See [`docs/ArchitectureOverview.md`](docs/ArchitectureOverview.md) for the full breakdown and design rationale.

### Real-time edit flow

What happens the instant a user drags a shape:

```mermaid
sequenceDiagram
    participant U as User
    participant LB as Liveblocks Storage
    participant OC as Other clients
    participant WH as NestJS webhook
    participant DB as PostgreSQL

    U->>LB: Drag shape (useMutation)
    LB-->>OC: Broadcast update over WebSocket (instant)
    LB-->>WH: storageUpdated event (async)
    WH->>DB: Persist node change
```

Liveblocks holds the live, authoritative state — the database is never in the critical path of a live edit.

### Core stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15.5, React 19.1, TypeScript |
| Canvas rendering | Konva 10 + react-konva 19 |
| Styling / UI | Tailwind CSS v4, Radix UI, shadcn/ui |
| Backend | NestJS 11 (Express) |
| ORM / DB | Prisma 7.7 + PostgreSQL |
| Auth | Clerk (JWT) |
| Real-time canvas sync | Liveblocks 3.18 (CRDT) |
| Real-time events | Socket.IO 4.8 |
| Data fetching | SWR, Axios |

---

## Project structure

```
design-code/
├── backend/          # NestJS API server
│   ├── prisma/        # Database schema
│   └── src/
│       ├── auth/           # Clerk JWT guard
│       ├── gateway/        # Socket.IO gateway
│       ├── liveblocks/     # Liveblocks auth + webhook
│       ├── project/, page/, nodes/, users/
│       ├── notifications/, access-requests/, invitations/, access/
│       └── dashboard/, search/, project-members/
├── frontend/         # Next.js application
│   └── src/
│       ├── app/            # App Router pages (route groups: (main), (editor))
│       ├── components/     # Canvas, panels, shared UI
│       ├── hooks/          # 25+ custom hooks
│       └── lib/            # API client, utilities
└── docs/             # Architecture documentation
```

Full tree in [`docs/FolderStructure.md`](docs/FolderStructure.md).

---

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- A [Clerk](https://clerk.com) account (for auth)
- A [Liveblocks](https://liveblocks.io) account (for canvas sync)

### 1. Clone and install

```bash
git clone https://github.com/your-username/canvasflow.git
cd canvasflow

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment variables

**`backend/.env`**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/canvasflow"
CLERK_SECRET_KEY="sk_test_..."
LIVEBLOCKS_SECRET_KEY="sk_..."
FRONTEND_URL="http://localhost:3000"
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY="pk_..."
```

### 3. Set up the database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Run it

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm run start:dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm run dev
```

Visit `http://localhost:3000` and sign in via Clerk to get started.

---

## API documentation

The backend exposes auto-generated Swagger docs at:

```
http://localhost:4000/api
```

Key endpoint groups: `/project`, `/pages`, `/nodes`, `/notifications`, `/access-requests`, `/invitations`, `/access`, `/dashboard`, `/search`. See [`docs/BackendArchitecture.md`](docs/BackendArchitecture.md) for the full module and endpoint inventory.

---

## Database schema

PostgreSQL via Prisma, 10 models: `User`, `Project`, `Page`, `Node`, `ProjectMember`, `PageVisit`, `Notification`, `ProjectInvitation`, `AccessRequest`, `AccessRequestEvent`.

Full ERD and table documentation in [`docs/DatabaseDesign.md`](docs/DatabaseDesign.md).

---

## Design decisions

A few notable choices, explained in more depth in the architecture docs:

- **Konva (HTML5 Canvas) over SVG** — scales better with hundreds of nodes; built-in transform handles
- **Liveblocks + Socket.IO as two separate real-time channels** — canvas sync is never blocked by notification traffic, and vice versa
- **Async persistence via webhook** — Liveblocks holds live authoritative state; a `storageUpdated` webhook persists to Postgres out of the critical path
- **NestJS's guard pipeline** — `ClerkAuthGuard` + `ProjectRoleGuard` cleanly separate authentication from authorization

---

## Roadmap

- [ ] Redis caching layer as concurrent room count grows
- [ ] Message queue for webhook/notification delivery
- [ ] Shared types package between frontend and backend
- [ ] Deeper test coverage on business logic (beyond controller/service definition tests)

---

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a PR.

## License

[MIT](LICENSE)
