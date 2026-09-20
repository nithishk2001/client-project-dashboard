# Client Project Dashboard

A full-stack project/task management tool where an Admin manages users and clients, Project Managers manage their own projects and assign tasks, and Developers work on tasks assigned to them. Includes real-time activity feeds and notifications over WebSocket.

## Overview

Think of it like a mini Jira/Trello scoped to client work:

- **Admin** manages users, clients, projects, and tasks, and can see everything.
- **Project Manager** creates projects (for a client), creates tasks inside their own projects, and assigns them to developers.
- **Developer** sees only the tasks assigned to them and updates their status as they work.

Every task status change is logged as an "activity" (who did what, and when), pushed live to anyone viewing that project, and can trigger a notification to the relevant person. A background job runs hourly and automatically marks any task past its due date as `OVERDUE`.

## Technologies

**Frontend:** React, TypeScript, Vite, React Router, Axios, native WebSocket
**Backend:** Node.js, Express, TypeScript
**Database:** PostgreSQL with Prisma ORM
**Auth:** JWT access token (short-lived, kept in memory on the frontend) + JWT refresh token (long-lived, stored in an HttpOnly cookie)
**Real-time:** `ws` library (raw WebSocket, no Socket.IO)
**Background jobs:** `node-cron`
**Validation:** Zod

## Features

- Login with JWT access + refresh tokens; refresh token lives in an HttpOnly cookie so JavaScript can never read it.
- Role-based authorization enforced on the **backend** in every controller — the frontend just hides buttons for convenience, it is not the security boundary.
- Client, project, and task CRUD with role-scoped visibility.
- Task status workflow: `TODO` → `IN_PROGRESS` → `COMPLETED`, or `OVERDUE` if the due date passes.
- Task priority: `LOW` / `MEDIUM` / `HIGH`.
- Every task change writes an `Activity` row (user, task, project, action, message, timestamp).
- Task filtering via query params: `/api/tasks?status=IN_PROGRESS&priority=HIGH&projectId=...`
- Hourly cron job that scans for overdue tasks and flips their status.
- Live activity feed per project over WebSocket, with the last 20 activities sent on reconnect so nobody misses updates while they were offline.
- Live in-app notifications with an unread count that updates instantly.

## Folder Structure

```text
backend/
  prisma/
    schema.prisma      # DB models
    seed.ts             # seed script
  src/
    controllers/        # one file per resource, plain functions
    routes/              # Express routers, wire up middleware + controllers
    middleware/          # authenticate, requireRole, errorHandler
    services/             # activityService, notificationService (shared logic)
    websocket/            # ws server, project "rooms", per-user messages
    jobs/                  # node-cron overdue job
    utils/                  # zod validators
    lib/                     # prisma client, jwt helpers
    app.ts                    # express app + route mounting
    server.ts                  # http server + websocket + cron bootstrap

frontend/
  src/
    components/    # Navbar, ProtectedRoute, TaskCard, ActivityFeed, Badge
    pages/          # Login, Dashboard, ProjectList/Details, TaskList/Details, Notifications, Clients
    services/        # axios client (api.ts), websocket client (socket.ts)
    hooks/             # useAuth (React context for the logged-in user)
    types/               # shared TypeScript interfaces
```

## Installation

### 1. Prerequisites
- Node.js 18+
- A running PostgreSQL instance

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env and set DATABASE_URL to your Postgres connection string
npx prisma migrate dev --name init
npm run seed
npm run dev
```

The API runs at `http://localhost:5000`, and the WebSocket server is attached to the same HTTP server at `ws://localhost:5000/ws`.

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment Variables

**backend/.env**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/client_project_dashboard?schema=public"
PORT=5000
FRONTEND_URL="http://localhost:5173"
JWT_ACCESS_SECRET="access_secret_change_me"
JWT_REFRESH_SECRET="refresh_secret_change_me"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
```

**frontend/.env**
```
VITE_API_URL="http://localhost:5000/api"
VITE_WS_URL="ws://localhost:5000/ws"
```

## Database Setup & Prisma Migration

The schema lives in `backend/prisma/schema.prisma`. To create the database tables:

```bash
cd backend
npx prisma migrate dev --name init
```

This also generates the Prisma Client used throughout the backend (`@prisma/client`).

To open a visual DB browser: `npx prisma studio`

## Seed Command

```bash
npm run seed
```

Creates:
- 1 Admin, 1 Project Manager, 2 Developers
- 2 Clients
- 2 Projects
- 4 Tasks (in different statuses/priorities)
- A few Activities and Notifications

**Test credentials (password is the same for all): `Password@123`**

| Role | Email |
|---|---|
| Admin | admin@test.com |
| Project Manager | manager@test.com |
| Developer | developer@test.com |
| Developer 2 | developer2@test.com |

## Running

Backend: `cd backend && npm run dev`
Frontend: `cd frontend && npm run dev`

Run both at the same time in two terminals.

## API Endpoints

**Auth**
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

**Users** (Admin only, except /developers)
```
GET    /api/users
POST   /api/users
DELETE /api/users/:id
GET    /api/users/developers      # any logged-in user, for assignment dropdowns
```

**Clients**
```
GET    /api/clients               # Admin, Project Manager
GET    /api/clients/:id           # Admin, Project Manager
POST   /api/clients               # Admin only
PUT    /api/clients/:id           # Admin only
DELETE /api/clients/:id           # Admin only
```

**Projects**
```
GET    /api/projects              # all roles, scoped by role
GET    /api/projects/:id
POST   /api/projects              # Admin, Project Manager
PUT    /api/projects/:id          # Admin, or the managing PM
DELETE /api/projects/:id          # Admin, or the managing PM
```

**Tasks**
```
GET    /api/tasks?status=&priority=&projectId=
GET    /api/tasks/:id
POST   /api/tasks                 # Admin, Project Manager
PUT    /api/tasks/:id             # Admin, or the managing PM
PATCH  /api/tasks/:id/status      # Admin, managing PM, or the assigned Developer
DELETE /api/tasks/:id             # Admin, or the managing PM
```

**Notifications**
```
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

**Dashboard**
```
GET    /api/dashboard/stats       # response shape depends on the caller's role
```

## Role Permissions (enforced server-side)

| Action | Admin | Project Manager | Developer |
|---|---|---|---|
| Manage users | ✅ | ❌ | ❌ |
| Manage clients | ✅ | view only | ❌ |
| Create projects | ✅ | ✅ (becomes manager) | ❌ |
| View/edit projects | all | own only | only via assigned tasks |
| Create/assign tasks | ✅ | own projects only | ❌ |
| Update task status | ✅ | own projects' tasks | own assigned tasks only |
| View activity | all | own projects | own projects |

Every one of these rules is checked in the Express controllers (see `src/middleware/roleCheck.ts` and the per-resource checks inside each controller), not just hidden in the UI. Even if someone bypassed the frontend and called the API directly, the backend would still reject requests outside their role.

## WebSocket Implementation

The WebSocket server (`src/websocket/wsServer.ts`) is attached to the same HTTP server as Express, on the path `/ws`.

1. The frontend connects with `ws://.../ws?token=<accessToken>`. The server verifies that JWT before accepting the connection — no token, no connection.
2. When a user opens a project page, the frontend sends `{ type: "JOIN_PROJECT", projectId }`. The server remembers that this socket is "in" that project's room, and immediately replies with the last 20 activities for that project (this is how a user who was offline catches up).
3. Whenever a task changes (created, updated, status changed), the controller calls `createActivity(...)`, which saves the activity to Postgres and then broadcasts it to everyone currently in that project's room via `broadcastToProject()`.
4. Notifications work similarly but target one specific user with `sendToUser()`, and include the user's updated unread count so the bell icon in the navbar updates instantly.

This is a simple in-memory list of connected clients (`const clients: ConnectedClient[] = []`) — good enough for a single server instance. It is **not** designed to scale across multiple server processes (see Limitations).

## Background Job

`src/jobs/overdueJob.ts` uses `node-cron` with the schedule `0 * * * *` (runs at the top of every hour). It looks for tasks where `dueDate < now` and `status != COMPLETED` and `status != OVERDUE` already, updates them to `OVERDUE`, writes an activity for each one, and notifies the assigned developer.

## Deployment

- **Backend:** deploy to any Node host (Render, Railway, Fly.io, an EC2 box, etc.). Make sure `DATABASE_URL` points at your production Postgres instance and run `npx prisma migrate deploy` as part of your deploy step. Set real, random values for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, and set `FRONTEND_URL` to your deployed frontend's origin (needed for CORS + cookies).
- **Frontend:** `npm run build` produces a static `dist/` folder that can be hosted on Vercel, Netlify, or any static host. Set `VITE_API_URL` / `VITE_WS_URL` to point at your deployed backend, and make sure the WebSocket URL uses `wss://` (not `ws://`) if your backend is served over HTTPS.
- Since the refresh token is an HttpOnly cookie, frontend and backend should either share a domain (e.g. `app.example.com` and `api.example.com` on the same root domain) or you'll need to configure `sameSite`/`secure` cookie options carefully for cross-site cookies to work.

## Limitations

This project was intentionally kept simple (junior/interview-friendly level), so some things a production app would need are left out on purpose:

- **No silent session restore on page refresh.** The access token lives only in memory, and there's no `/api/auth/me` endpoint, so refreshing the browser logs you out (you'll need to log in again). The refresh-token cookie is still there and does work if you add a `/me` endpoint later.
- **WebSocket state is in-memory and single-process.** If you ran multiple backend instances behind a load balancer, users connected to different instances wouldn't see each other's real-time updates without adding something like Redis pub/sub.
- **No pagination.** Lists (tasks, activities, notifications) are capped with a simple `take: N` rather than full pagination.
- **No file uploads, comments, or email notifications** — only in-app notifications.
- **No automated tests** included, to keep the codebase small and easy to read/explain.
- **No rate limiting** on auth endpoints.

## Explaining This Project in an Interview

A few talking points that map directly to the code:

- **"How do you handle auth?"** — Access token in memory (short-lived, 15 min), refresh token in an HttpOnly cookie (7 days) so it can't be stolen via XSS. Axios has a response interceptor (`frontend/src/services/api.ts`) that catches a 401, calls `/api/auth/refresh`, and retries the original request automatically.
- **"How do you enforce permissions?"** — Two layers: a generic `requireRole()` middleware for route-level checks, and per-resource ownership checks inside each controller (e.g. a Project Manager can only edit a project if `project.managerId === req.user.userId`). The frontend hides buttons too, but that's just UX — the real enforcement is server-side.
- **"How does real-time work?"** — Plain `ws` WebSocket server sharing the same HTTP server as Express. Clients join a "room" per project by sending a message after connecting; the server keeps an in-memory array of connected clients and filters by `projectId` when broadcasting.
- **"What happens when a task becomes overdue?"** — A `node-cron` job runs every hour, queries for tasks past their due date that aren't completed, updates their status, and reuses the same `createActivity`/`createNotification` services that normal task updates use — so overdue tasks show up in the activity feed exactly like a manual status change would.
