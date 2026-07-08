# Frontend Architecture

## Framework

Next.js 15.5 with the App Router, React 19.1, and TypeScript. The application uses the route group pattern to separate authenticated pages from the editor.

## Routing

### Route Groups

```
(main)/              # Authenticated pages — wrapped in sidebar + NotificationProvider
  dashboard/         # Aggregated project overview
  project/           # All projects list
  project/[id]/pages/    # Pages within a project
  project/[id]/settings/ # Project configuration
  profile/           # Own profile settings
  profile/[userId]/ # Other user's public profile
  notifications/     # Full notification inbox
  access/            # Access Center (invitations + requests)
  requests/          # Outgoing access requests (redirects to /access)

(editor)/            # Canvas editor — wrapped in NotificationProvider only
  editor/[projectId]/page/[pageId]  # The full editor
```

### Middleware (Clerk)

The middleware at `frontend/src/middleware.ts` handles:

1. **Route protection**: Public routes (`/`, `/invitations/[token]`) vs protected routes (all others)
2. **Authentication redirect**: Unauthenticated users on protected routes → `/`; authenticated users on `/` → `/sync`
3. **Legacy redirects**: `/invitations` and `/requests` → `/access` (unified Access Center)

## Layout Hierarchy

```
RootLayout (server)
├── ClerkProvider
│   ├── Providers (ErrorBoundary)
│   │   ├── (main)/layout (NotificationProvider + Sidebar + ErrorBoundary)
│   │   │   └── page content
│   │   ├── (editor)/layout (NotificationProvider)
│   │   │   └── editor page (RoomProvider → Editor)
│   │   └── invitations/[token] (public)
│   └── Toaster (sonner)
```

## Component Architecture

### Canvas Editor Components

```
EditorPage (page.tsx)
├── LoadingOverlay (while loading access)
├── NoAccessScreen (if denied)
├── RoomProvider (Liveblocks)
│   └── Editor
│       ├── LoadingOverlay (while Liveblocks connects)
│       ├── TopToolbar
│       │   ├── Tool buttons (select/pan, undo/redo, align)
│       │   ├── Members dropdown (with access requests for owner)
│       │   ├── NotificationBell
│       │   ├── CollaboratorAvatars
│       │   └── Save indicator
│       ├── LeftSidebar
│       │   ├── InsertPanel (shape palette)
│       │   ├── LayersPanel (layer list with drag reorder)
│       │   └── PagesPanel (page management)
│       ├── CanvasArea
│       │   ├── Konva Stage
│       │   │   ├── Konva Layer
│       │   │   │   └── NodeRenderer × n
│       │   │   └── Transformer (for selected nodes)
│       │   └── SelectionRect (rubber band)
│       ├── CollaboratorCursors
│       ├── InspectorPanel (right panel)
│       └── (AccessRequestBanner — now integrated into TopToolbar)
```

### Page Components

Each page under `(main)/` follows the pattern:
- Client component with `"use client"`
- Uses `useApi()` for API calls
- Uses `useUser()` from Clerk for auth context
- Wrapped in `ErrorBoundary` by the layout

### Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `TopToolbar` | `components/TopToolbar.tsx` | Canvas toolbar with tools, members, presence |
| `CanvasArea` | `components/CanvasArea.tsx` | Konva stage setup + transformer |
| `NodeRenderer` | `components/NodeRenderer.tsx` | Renders individual Konva nodes by type |
| `LeftSidebar` | `components/LeftSidebar.tsx` | Collapsible left panel (insert, layers, pages) |
| `InspectorPanel` | `components/InspectorPanel.tsx` | Right property panel (position, size, appearance, typography, effects) |
| `LayersPanel` | `components/LayersPanel.tsx` | Layer list with drag-and-drop reordering |
| `InsertPanel` | `components/InsertPanel.tsx` | Shape insertion grid |
| `CollaboratorAvatars` | `components/CollaboratorAvatars.tsx` | Avatar stack for connected users |
| `NotificationBell` | `components/NotificationBell.tsx` | Bell icon with unread count + dropdown |
| `ColorPicker` | `components/ColorPicker.tsx` | Color input with presets |
| `LoadingOverlay` | `components/LoadingOverlay.tsx` | Animated loading screen |

## State Management

The application uses a layered state approach:

| State Type | Mechanism | Used For |
|-----------|-----------|----------|
| Server state | SWR (stale-while-revalidate) | Project roles |
| Real-time collaborative state | Liveblocks Storage (`LiveMap`) | Canvas nodes |
| Real-time presence | Liveblocks Presence | Cursors, selections, user info |
| Real-time events | Socket.IO + React Context | Notifications |
| UI state | React `useState` / `useReducer` | Most component state |
| Canvas history | `useCanvasHistory` (custom hook) | Undo/redo stack |

### State Flow Diagram

```
User Action
    │
    ▼
Component → useState/useReducer → Local UI update
    │
    ├──→ useApi (axios) → REST API → Database
    │
    └──→ useMutation (Liveblocks) → Liveblocks Storage
              │
              ├──→ WebSocket broadcast → Other clients (real-time)
              │
              └──→ Webhook → Backend → Database (async persistence)
```

## Custom Hooks

| Hook | State It Manages | Purpose |
|------|-----------------|---------|
| `useCanvasHistory` | `history: Node[][]`, `historyStep: number` | Undo/redo stack with save points |
| `useCanvasInteractions` | `selectionRect`, drag state | Mouse, transform, selection, zoom/pan |
| `useShapeActions` | (operates on nodes via setNodes) | Add, delete, duplicate, arrange |
| `useSnapping` | (stateless computation) | Grid snap + smart guide calculation |
| `useAlignment` | (stateless computation) | Align/distribute node positions |
| `useViewControl` | `stageScale`, `stagePosition` | Zoom and pan transformations |
| `useSocket` | `socket: Socket \| null` | Socket.IO connection lifecycle |
| `useSyncEngine` | `syncStatus`, mutation queue | Debounced mutation batching + retry |
| `useIdleDetection` | `isIdle: boolean` | User idle state for presence |
| `useCollaboratorUpdates` | (dispatches CustomEvent) | Real-time collaborator profile sync |

### Canvas Rendering

The canvas uses Konva (`react-konva`) with this rendering pipeline:

1. **Stage**: Container for the entire canvas (handles zoom/pan transforms)
2. **Layer**: Single Konva Layer for all nodes (z-ordering handled via zIndex property, not Konva layers)
3. **NodeRenderer**: Maps each `Node` to the appropriate Konva element:
   - `rect` → `Rect`
   - `circle` → `Circle`
   - `text` → `Text`
   - `image` → `Image`
   - `line` / `arrow` / `polyline` → `Line`
   - `star` / `diamond` → `Star` (with adjusted sides)
   - `stickyNote` / `codeBlock` → `Group(Rect + Text)`
   - `frame` → `Rect` (with dashed border)
   - `divider` → `Line`
4. **Transformer**: Konva `Transformer` node attached to selected nodes (resize, rotate)
5. **Selection**: Rubber-band selection via `SelectionRect` overlay

## Socket.IO Integration

The Socket.IO client (`useSocket` hook):
1. Gets a Clerk JWT token via `getToken()`
2. Connects to the backend with `auth: { token }`
3. Uses `transports: ["websocket", "polling"]` for reliability
4. Listens for events on specific channels (notifications, access requests, etc.)
5. Disconnects on component unmount

## Liveblocks Integration

The Liveblocks client (`liveblocks.config.ts`):
1. Uses a custom `authEndpoint` that sends a Clerk JWT Bearer token
2. Connects to Liveblocks Cloud for real-time canvas sync
3. Provides typed `RoomProvider`, `useStorage`, `useMutation`, `useOthers`, `useMyPresence`
4. Storage type: `LiveMap<string, Node>` for canvas nodes
5. Presence type: cursor, selection, user info, idle status
