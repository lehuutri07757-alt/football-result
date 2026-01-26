# Agent Instructions

You are working on a sports betting platform. Follow these rules strictly.

## Tech Stack

- **Backend**: NestJS + Prisma + PostgreSQL + Redis
- **Frontend**: Next.js 14 (App Router) + TailwindCSS + shadcn/ui + Zustand
- **Monorepo**: pnpm workspaces

---

## Code Generation Rules

### 1. Always Use Enums - Never Raw Strings

```typescript
// ❌ BAD
status: string = 'pending'

// ✅ GOOD
status: RequestStatus = RequestStatus.PENDING
```

**Available Enums (Prisma):**
```prisma
UserStatus: active | suspended | blocked | self_excluded
TransactionType: deposit | withdrawal | bet_placed | bet_won | bet_refund | bonus | transfer | adjustment
TransactionStatus: pending | completed | failed | cancelled
MatchStatus: scheduled | live | finished | cancelled | postponed
BetStatus: pending | won | lost | void | partial_won | cashout
SelectionResult: pending | won | lost | void | half_won | half_lost
```

**Use These Enums (add to schema if missing):**
```prisma
AgentStatus: active | inactive | suspended | terminated
OddsStatus: active | suspended | closed | settled
RequestStatus: pending | approved | rejected | processing | completed | cancelled
PaymentMethod: bank_transfer | momo | zalopay | vnpay | crypto
NotificationType: system | deposit | withdrawal | bet_result | promotion | security
TicketStatus: open | in_progress | waiting_customer | resolved | closed
TicketPriority: low | normal | high | urgent
LoginStatus: success | failed | blocked
BalanceType: real | bonus
BetSlipType: single | parlay | system
MatchPeriod: not_started | first_half | half_time | second_half | extra_time | penalties | full_time
```

### 2. NestJS Module Structure

When creating a new module, follow this exact structure:

```
modules/{feature}/
├── {feature}.module.ts
├── {feature}.controller.ts
├── {feature}.service.ts
├── dto/
│   ├── create-{feature}.dto.ts
│   ├── update-{feature}.dto.ts
│   ├── query-{feature}.dto.ts
│   └── index.ts
├── entities/
│   └── {feature}.entity.ts      # Response types
└── constants/
    └── {feature}.constants.ts   # Enums, constants
```

### 3. DTO Pattern

```typescript
// create-deposit.dto.ts
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreateDepositDto {
  @ApiProperty({ example: 1000000, minimum: 10000 })
  @IsNumber()
  @Min(10000)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.bank_transfer })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'Vietcombank', required: false })
  @IsString()
  @IsOptional()
  bankName?: string;
}
```

### 4. Service Pattern

```typescript
// deposits.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RequestStatus, TransactionType } from '@prisma/client';

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateDepositDto) {
    return this.prisma.depositRequest.create({
      data: {
        userId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        status: RequestStatus.pending,  // ✅ Use enum
      },
    });
  }

  async approve(id: string, adminId: string) {
    const deposit = await this.prisma.depositRequest.findUnique({
      where: { id },
      include: { user: { include: { wallet: true } } },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit request not found');
    }

    if (deposit.status !== RequestStatus.pending) {
      throw new BadRequestException('Request already processed');
    }

    // Use transaction for atomic operations
    return this.prisma.$transaction(async (tx) => {
      // Update deposit status
      const updated = await tx.depositRequest.update({
        where: { id },
        data: {
          status: RequestStatus.approved,
          processedBy: adminId,
          processedAt: new Date(),
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { userId: deposit.userId },
        data: {
          realBalance: { increment: deposit.amount },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: deposit.user.wallet.id,
          type: TransactionType.deposit,
          amount: deposit.amount,
          balanceBefore: deposit.user.wallet.realBalance,
          balanceAfter: deposit.user.wallet.realBalance.add(deposit.amount),
          status: TransactionStatus.completed,
          referenceType: 'deposit_request',
          referenceId: id,
        },
      });

      return updated;
    });
  }
}
```

### 5. Controller Pattern

```typescript
// deposits.controller.ts
import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

@ApiTags('Deposits')
@ApiBearerAuth()
@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Post()
  @ApiOperation({ summary: 'Create deposit request' })
  create(@Req() req, @Body() dto: CreateDepositDto) {
    return this.depositsService.create(req.user.id, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve deposit request' })
  @UseGuards(RolesGuard)
  @Roles('admin', 'operator')
  approve(@Param('id') id: string, @Req() req) {
    return this.depositsService.approve(id, req.user.id);
  }
}
```

### 6. Query DTO with Pagination

```typescript
// query-deposit.dto.ts
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';

export class QueryDepositDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: RequestStatus })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  toDate?: Date;
}
```

### 7. Paginated Response

```typescript
// Service method
async findAll(query: QueryDepositDto) {
  const { page, limit, status, fromDate, toDate } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.DepositRequestWhereInput = {
    ...(status && { status }),
    ...(fromDate && { createdAt: { gte: fromDate } }),
    ...(toDate && { createdAt: { lte: toDate } }),
  };

  const [data, total] = await Promise.all([
    this.prisma.depositRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true } } },
    }),
    this.prisma.depositRequest.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

## Frontend Rules

### 1. API Service Pattern (Interfaces in Separate File)

```typescript
// types/deposit.ts
import { RequestStatus, PaymentMethod } from '@/types/enums';

export interface CreateDepositPayload {
  amount: number;
  paymentMethod: PaymentMethod;
  bankName?: string;
}

export interface DepositQuery {
  page?: number;
  limit?: number;
  status?: RequestStatus;
}
```

```typescript
// services/deposit.service.ts
import api from './api';
import { CreateDepositPayload, DepositQuery } from '@/types/deposit';

export const depositService = {
  create: (data: CreateDepositPayload) =>
    api.post('/deposits', data),

  getAll: (params: DepositQuery) =>
    api.get('/deposits', { params }),

  getById: (id: string) =>
    api.get(`/deposits/${id}`),

  approve: (id: string) =>
    api.post(`/deposits/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.post(`/deposits/${id}/reject`, { reason }),
};
```

### 2. Shared Enums (Frontend)

```typescript
// types/enums.ts
export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
  VNPAY = 'vnpay',
}

// Status display mapping
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: 'Chờ xử lý',
  [RequestStatus.APPROVED]: 'Đã duyệt',
  [RequestStatus.REJECTED]: 'Từ chối',
  [RequestStatus.PROCESSING]: 'Đang xử lý',
  [RequestStatus.COMPLETED]: 'Hoàn thành',
  [RequestStatus.CANCELLED]: 'Đã hủy',
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [RequestStatus.APPROVED]: 'bg-green-100 text-green-800',
  [RequestStatus.REJECTED]: 'bg-red-100 text-red-800',
  [RequestStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [RequestStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [RequestStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
};
```

### 3. React Query Usage

```typescript
// hooks/useDeposits.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depositService, DepositQuery } from '@/services/deposit.service';

export function useDeposits(params: DepositQuery) {
  return useQuery({
    queryKey: ['deposits', params],
    queryFn: () => depositService.getAll(params),
  });
}

export function useApproveDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => depositService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });
}
```

### 4. Component with Status Badge

```tsx
// components/StatusBadge.tsx
import { cn } from '@/lib/utils';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, RequestStatus } from '@/types/enums';

interface StatusBadgeProps {
  status: RequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn(
      'px-2 py-1 rounded-full text-xs font-medium',
      REQUEST_STATUS_COLORS[status]
    )}>
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `create-deposit.dto.ts` |
| Classes/Components | PascalCase | `CreateDepositDto`, `DepositList` |
| Functions/Variables | camelCase | `createDeposit`, `depositData` |
| Constants | UPPER_SNAKE | `MAX_DEPOSIT_AMOUNT` |
| Enums | PascalCase | `RequestStatus` |
| Enum values (Prisma) | snake_case | `bank_transfer` |
| Enum values (TS) | UPPER_SNAKE | `BANK_TRANSFER` |
| DB columns | snake_case | `created_at` |
| API endpoints | kebab-case | `/deposit-requests` |

---

## Do NOT

1. ❌ Use raw strings for status/type fields - always use enums
2. ❌ Skip validation decorators in DTOs
3. ❌ Forget `@ApiProperty` for Swagger docs
4. ❌ Use `any` type - use `unknown` or proper types
5. ❌ Mix async/await with .then()
6. ❌ Forget error handling in services
7. ❌ Skip transactions for multi-table operations
8. ❌ Hardcode values - use constants/enums
9. ❌ Create files outside the module structure
10. ❌ Skip pagination for list endpoints

---

## Commands Reference

```bash
pnpm dev              # Start all
pnpm dev:api          # Backend only
pnpm dev:web          # Frontend only
pnpm prisma:generate  # After schema changes
pnpm prisma:push      # Push to database
pnpm prisma:studio    # Database GUI
pnpm lint             # Check code style
```
