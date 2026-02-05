# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-05
**Commit:** 986930f4
**Branch:** main

## OVERVIEW

Sports betting platform (demo/learning). Monorepo: NestJS API + Next.js 14 frontend + Prisma/PostgreSQL + Redis.

## STRUCTURE

```
footballs/
├── apps/
│   ├── api/           # NestJS backend (port 3001)
│   │   ├── src/
│   │   │   ├── modules/     # 20 feature modules
│   │   │   ├── prisma/      # PrismaService
│   │   │   ├── redis/       # RedisModule
│   │   │   └── common/      # Shared utils
│   │   └── prisma/          # Schema + migrations
│   └── web/           # Next.js 14 frontend (port 3000)
│       └── src/
│           ├── app/         # App Router pages
│           ├── components/  # UI (shadcn/ui)
│           ├── services/    # API clients
│           ├── stores/      # Zustand stores
│           └── types/       # TypeScript types
└── docker/            # Docker configs
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| API module scaffolding | `apps/api/src/modules/{feature}/` | Follow existing pattern: `.module.ts`, `.service.ts`, `.controller.ts`, `dto/` |
| Auth guards/decorators | `apps/api/src/modules/auth/` | `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`, `@Roles()`, `@Permissions()` |
| External data sync | `apps/api/src/modules/api-football/` | Complex: Bull queues, schedulers, multiple sync services |
| Database schema | `apps/api/prisma/schema.prisma` | Enums defined here, all models |
| Frontend API calls | `apps/web/src/services/` | Axios-based, auto token refresh |
| State management | `apps/web/src/stores/` | Zustand: `auth.store.ts`, `language.store.ts`, `betslip.store.ts` |
| UI components | `apps/web/src/components/ui/` | shadcn/ui components |
| Admin pages | `apps/web/src/app/admin/` | 15+ admin route segments |

## CONVENTIONS

### Mandatory: Use Enums - NEVER Raw Strings

```typescript
// Defined in prisma/schema.prisma
UserStatus: active | suspended | blocked | self_excluded
TransactionType: deposit | withdrawal | bet_placed | bet_won | bet_refund | bonus | transfer | adjustment
TransactionStatus: pending | completed | failed | cancelled
MatchStatus: scheduled | live | finished | cancelled | postponed
BetStatus: pending | won | lost | void | partial_won | cashout
OddsStatus: active | suspended | closed | settled
```

### NestJS Module Structure

```
modules/{feature}/
├── {feature}.module.ts
├── {feature}.controller.ts
├── {feature}.service.ts
├── dto/
│   ├── create-{feature}.dto.ts
│   ├── update-{feature}.dto.ts
│   └── query-{feature}.dto.ts
├── entities/          # Response types (optional)
└── constants/         # Enums, constants (optional)
```

### DTO Requirements

- Always use `class-validator` decorators (`@IsString()`, `@IsEnum()`, etc.)
- Always add `@ApiProperty` for Swagger docs
- Pagination: `page`, `limit` (max 100), `fromDate`, `toDate` pattern

### Service Pattern

- Inject `PrismaService` for DB access
- Use `@Injectable()` decorator
- Throw `NotFoundException`, `BadRequestException` for errors
- Use `this.prisma.$transaction()` for multi-table atomic ops

### Frontend Service Pattern

- Interfaces in `types/` files, not in service files
- Services use `api` client from `services/api.ts`
- Token auto-refresh handled by interceptors

## ANTI-PATTERNS (THIS PROJECT)

| Pattern | Reason |
|---------|--------|
| Raw strings for status/types | Use Prisma enums always |
| `any` type | Use `unknown` or proper types |
| Skipping validation decorators | DTOs must validate |
| Mixing async/await with `.then()` | Pick one, prefer async/await |
| Skipping `@ApiProperty` | Swagger docs incomplete |
| Multi-table ops without `$transaction` | Data inconsistency risk |
| Files outside module structure | Breaks conventions |
| Skip pagination on list endpoints | Performance issue |

## UNIQUE STYLES

### Path Aliases

- Backend: `@/` maps to `apps/api/src/`
- Frontend: `@/` maps to `apps/web/src/`

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `create-deposit.dto.ts` |
| Classes | PascalCase | `CreateDepositDto` |
| Functions/Variables | camelCase | `createDeposit` |
| Constants | UPPER_SNAKE | `MAX_DEPOSIT_AMOUNT` |
| DB columns | snake_case | `created_at` |
| API endpoints | kebab-case | `/deposit-requests` |

### Database

- UUIDs for all primary keys
- `@map("snake_case")` for column names
- `@@map("table_name")` for table names
- `Decimal(18,2)` for money, `Decimal(8,3)` for odds

## COMMANDS

```bash
pnpm dev              # Start all (frontend + backend)
pnpm dev:api          # Backend only (localhost:3001)
pnpm dev:web          # Frontend only (localhost:3000)
pnpm prisma:generate  # After schema changes
pnpm prisma:push      # Push schema to DB
pnpm prisma:studio    # Database GUI
pnpm docker:up        # Start PostgreSQL + Redis
pnpm docker:down      # Stop containers
pnpm lint             # Check code style
```

## NOTES

### Global API Prefix

All API routes prefixed with `/api`. Swagger at `/api/docs`.

### CORS

Currently only allows `localhost:3000`. Update `apps/api/src/main.ts` for production.

### Rate Limiting

ThrottlerModule: 100 requests per 60 seconds.

### Auth Flow

JWT-based. Access token in `Authorization: Bearer`. Refresh token endpoint at `/api/auth/refresh`.

### Bull Queues

Used for data sync jobs. Redis required. Queue name: `sync-jobs`.

### Agent Hierarchy

Multi-level agent/affiliate system. Parent-child relationships in `Agent` model. Users can belong to agents.
