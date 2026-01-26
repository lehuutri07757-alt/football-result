# 🏆 Sports Betting Platform

> **Note:** This is a learning/demo project, not a real gambling system.

## 📋 Tech Stack

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui, Zustand
- **Backend:** NestJS, Prisma, PostgreSQL, Redis
- **Real-time:** Socket.IO
- **DevOps:** Docker, pnpm workspaces

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Installation

```bash
# Install dependencies
pnpm install

# Start Docker services (PostgreSQL, Redis)
pnpm docker:up

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# Start development servers
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm dev:web` | Start frontend only |
| `pnpm dev:api` | Start backend only |
| `pnpm docker:up` | Start Docker services |
| `pnpm docker:down` | Stop Docker services |
| `pnpm db:studio` | Open Prisma Studio |

## 📁 Project Structure

```
sports-betting/
├── apps/
│   ├── web/          # Next.js Frontend
│   └── api/          # NestJS Backend
├── packages/         # Shared packages
├── docker/           # Docker configuration
└── docs/             # Documentation
```

## 🔗 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Adminer (DB UI) | http://localhost:8080 |
