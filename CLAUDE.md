# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sports betting platform (demo/learning project) with a monorepo structure managed by pnpm workspaces.

## Commands

```bash
# Install dependencies (all workspaces)
pnpm install

# Start all dev servers (frontend + backend)
pnpm dev

# Start individual apps
pnpm dev:web    # Frontend at localhost:3000
pnpm dev:api    # Backend at localhost:3001

# Build
pnpm build

# Lint
pnpm lint

# Database (Prisma)
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:push       # Push schema to database
pnpm prisma:migrate    # Run migrations
pnpm prisma:seed       # Seed database
pnpm prisma:studio     # Open Prisma Studio

# Docker
pnpm docker:up         # Start PostgreSQL, Redis
pnpm docker:down       # Stop containers
```

## Architecture

### Monorepo Structure
- `apps/api/` - NestJS backend (port 3001)
- `apps/web/` - Next.js 14 frontend (port 3000)
- `docker/` - Docker configurations

### Backend (apps/api)

NestJS application with modular structure in `src/modules/`:

**Core modules:**
- `auth/` - JWT authentication with passport strategies, guards (jwt, local, roles, permissions), decorators
- `users/` - User management with role-based access
- `roles/` - Role definitions and permissions
- `wallet/` - User wallet and balance management
- `transactions/` - Transaction history

**Domain modules:**
- `sports/`, `leagues/`, `teams/`, `matches/` - Sports data hierarchy
- `betting-limits/` - Betting constraints
- `deposits/`, `withdrawals/` - Payment processing
- `agents/` - Agent/affiliate hierarchy system

**Infrastructure:**
- `prisma/` - Database service and module (schema at `apps/api/prisma/schema.prisma`)
- `settings/` - System configuration
- `admin/` - Admin operations

Each module follows NestJS conventions: `*.module.ts`, `*.service.ts`, `*.controller.ts`, with DTOs in `dto/` subdirectories.

### Frontend (apps/web)

Next.js 14 with App Router:
- `src/app/` - Routes (login, register, dashboard, wallet, profile, admin/*)
- `src/components/` - UI components (shadcn/ui in `ui/`, admin components in `admin/`)
- `src/services/` - API client (`api.ts`) and service modules
- `src/stores/` - Zustand stores (auth, language)
- `src/contexts/` - React contexts (AdminThemeContext)
- `src/lib/` - Utilities (utils.ts, i18n.ts)

### Database

PostgreSQL with Prisma ORM. Key entities:
- User/Role/Agent hierarchy (agents have parent/child relationships)
- Wallet/Transaction for balance management
- Sport/League/Team/Match for sports data
- Bet/BetSelection/Odds for betting
- DepositRequest/WithdrawalRequest for payments

### Real-time

Socket.IO for live updates (match scores, odds changes).

## Environment Variables

**Backend** (`apps/api/.env`):
- `DATABASE_URL` - PostgreSQL connection string
- JWT and Redis credentials

**Frontend** (`apps/web/.env.local`):
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Coding Conventions

- TypeScript throughout; use async/await and typed DTOs
- PascalCase for React components and NestJS providers
- camelCase for functions/variables
- Lowercase route segments in Next.js
- Ordered imports: external, alias, relative
- ESLint rules per workspace; fix violations before commit

## CI/CD

GitLab CI builds Docker images for api and web on changes to their respective directories. Production images via `docker/docker-compose.prod.yml`.
