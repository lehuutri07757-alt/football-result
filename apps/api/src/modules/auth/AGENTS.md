# AUTH MODULE

JWT authentication with Passport strategies, guards, and decorators.

## STRUCTURE

```
auth/
├── auth.module.ts
├── auth.service.ts         # Login/register/refresh
├── auth.controller.ts      # /auth endpoints
├── strategies/
│   ├── jwt.strategy.ts     # Validates JWT token
│   └── local.strategy.ts   # Username/password
├── guards/
│   ├── jwt-auth.guard.ts   # @UseGuards(JwtAuthGuard)
│   ├── local-auth.guard.ts # Login endpoint
│   ├── roles.guard.ts      # @Roles('admin')
│   └── permissions.guard.ts # @Permissions('users:read')
├── decorators/
│   ├── roles.decorator.ts
│   └── permissions.decorator.ts
└── dto/
    ├── login.dto.ts
    ├── register.dto.ts
    ├── refresh-token.dto.ts
    └── change-password.dto.ts
```

## GUARD USAGE

```typescript
// Basic auth (any logged-in user)
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Req() req) { return req.user; }

// Role-based
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator')
@Post('approve')
approve() { ... }

// Permission-based
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('deposits:approve')
@Post('approve')
approve() { ... }
```

## DECORATOR USAGE

```typescript
// roles.decorator.ts exports
@Roles('admin')          // Single role
@Roles('admin', 'mod')   // Multiple roles (OR)

// permissions.decorator.ts exports
@Permissions('users:read')
@Permissions('users:read', 'users:write')  // OR logic
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Add new auth endpoint | `auth.controller.ts` |
| Modify JWT validation | `strategies/jwt.strategy.ts` |
| Change JWT expiry | `auth.module.ts` (JwtModule config) |
| Add new guard | `guards/` + export from `auth.module.ts` |
| Add new decorator | `decorators/` + export from `decorators/index.ts` |

## JWT CONFIG

```typescript
// From ConfigService
JWT_SECRET: string
JWT_EXPIRES_IN: string  // Default '7d'
```

## ANTI-PATTERNS

- Don't check roles/permissions manually in service - use guards
- Don't store tokens in DB - JWT is stateless
- Don't forget to export new guards/decorators from module
