# LAPKIN — Laporan Kinerja PNS

Full-stack web application for managing daily civil servant performance reports.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| Backend | NestJS + Fastify + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT via httpOnly Cookie |
| Realtime | Socket.io (WebSocket) |
| State | Zustand |
| Monorepo | npm workspaces |

---

## Project Structure

```
lapkin-app/
├── apps/
│   ├── backend/          # NestJS + Fastify API
│   │   └── src/
│   │       ├── common/   # Guards, decorators, types
│   │       ├── database/ # Drizzle schema, migrations, seeds
│   │       └── modules/  # auth, users, lapkin, websocket
│   └── frontend/         # React + Vite SPA
│       └── src/
│           ├── components/  # Reusable UI + domain components
│           ├── hooks/       # useSocket, useAsyncAction
│           ├── pages/       # Auth, Pegawai, Manager, Admin
│           ├── services/    # API + Socket clients
│           ├── stores/      # Zustand stores
│           └── types/       # Shared TypeScript interfaces
└── package.json          # Root monorepo
```

---

## Prerequisites

- **Node.js** v20+
- **PostgreSQL** v15+
- **npm** v9+

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd lapkin-app
npm install
```

### 2. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/lapkin_db
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
PORT=3000
COOKIE_SECRET=your-cookie-secret-min-32-chars
FRONTEND_URL=http://localhost:5173
```

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE lapkin_db;"
```

### 4. Run migrations

```bash
cd apps/backend
npx drizzle-kit push
```

Or manually apply the SQL migration:

```bash
psql -U postgres -d lapkin_db -f src/database/migrations/0001_initial_schema.sql
```

### 5. Seed demo data

```bash
cd apps/backend
npm run db:seed
```

This creates three demo accounts:

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Manager | `irham` | `manager123` |
| Pegawai | `ruslan` | `pegawai123` |

---

## Running the App

### Development (both simultaneously)

```bash
# From root
npm run dev
```

### Separately

```bash
# Backend only (port 3000)
npm run dev:backend

# Frontend only (port 5173)
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173)

---

## User Roles & Flow

### 👤 Pegawai
1. Log in → Dashboard shows LAPKIN stats
2. Go to "LAPKIN Saya" → Create new LAPKIN for a date
3. Add rows: time range, task description, result, percentages
4. When ready → **Kunci untuk Evaluasi** (locks it)
5. Can **Buka Kunci** to edit again — as long as manager hasn't evaluated
6. Once all rows evaluated → status becomes **Dievaluasi**

### 👔 Manager
1. Log in → Dashboard shows pending evaluations
2. Go to "LAPKIN Bawahan" → filter by status
3. Open a LOCKED lapkin → click ⭐ per row to give **Nilai Akhir (%)**
4. When all rows scored → LAPKIN auto-moves to **Dievaluasi**

### 🛡️ Admin
1. Go to "Kelola Pengguna"
2. Create / edit / delete user accounts
3. Assign roles and set manager-pegawai relationships

---

## LAPKIN Status Flow

```
DRAFT ──lock──▶ LOCKED ──all rows evaluated──▶ EVALUATED
  ◀──unlock──      (manager cannot evaluate if not locked)
                   (pegawai cannot unlock after evaluation)
```

---

## API Endpoints

### Auth
```
POST  /api/auth/login
POST  /api/auth/logout
GET   /api/auth/me
```

### Users (Admin only)
```
GET    /api/users
GET    /api/users/managers
GET    /api/users/direct-reports   (Manager)
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
```

### LAPKIN
```
GET    /api/lapkins                         (role-filtered)
GET    /api/lapkins/:id
POST   /api/lapkins                         (Pegawai)
DELETE /api/lapkins/:id                     (Pegawai)
PATCH  /api/lapkins/:id/lock                (Pegawai)
PATCH  /api/lapkins/:id/unlock              (Pegawai)
POST   /api/lapkins/:id/rows                (Pegawai)
PATCH  /api/lapkins/:id/rows/:rowId         (Pegawai)
DELETE /api/lapkins/:id/rows/:rowId         (Pegawai)
PATCH  /api/lapkins/:id/rows/:rowId/evaluate (Manager)
```

### WebSocket Events
```
lapkin:locked     → Notifies manager when pegawai locks
lapkin:unlocked   → Notifies manager when pegawai unlocks
lapkin:evaluated  → Notifies pegawai when manager scores a row
```

---

## Building for Production

```bash
# Build both apps
npm run build

# Start backend
cd apps/backend && npm run start
```

For frontend, serve the `apps/frontend/dist` folder via nginx or similar.

---

## Database Management

```bash
cd apps/backend

# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (dev only)
npm run db:push

# Open Drizzle Studio (visual DB editor)
npm run db:studio
```
