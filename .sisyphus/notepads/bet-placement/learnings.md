# Learnings

## Project Conventions
- NestJS modules follow: module.ts, service.ts, controller.ts, dto/ structure
- All balance ops use `prisma.$transaction()` for atomicity
- WalletService captures `balanceBefore`/`balanceAfter` on every transaction
- Auth: `req.user.sub` gives userId via JwtAuthGuard
- Enums from Prisma: BetStatus, OddsStatus, SelectionResult, TransactionType
- Frontend uses `api` client from `services/api.ts` with auto token refresh
- Types go in `types/`, not in service files
- Match.externalId maps to API-Football fixtureId (@@unique)
- Odds are updated in-place by sync, not versioned

## Module Registration
- All modules registered in `apps/api/src/app.module.ts` imports array
- BettingLimitsModule exports BettingLimitsService for use by other modules
- WalletModule exports WalletService

## Key Services Available
- `BettingLimitsService.validateBetAmount(userId, amount)` - validates min/max/daily/weekly/monthly
- `WalletService.getWalletByUserId(userId)` - gets wallet with user info
- `WalletService.getBalance(userId)` - gets balance breakdown (real/bonus/pending/totalAvailable)

## Frontend Bet Service Implementation

### Created Files
- `apps/web/src/services/bet.service.ts` - API service for bet operations
- `apps/web/src/types/bet.ts` - Already existed with proper type definitions

### Service Pattern (Frontend)
```typescript
// Service exports const object with methods
export const betService = {
  placeBet: (data: PlaceBetRequest) => api.post<PlaceBetResponse>('/bets/place', data),
  getBets: (params?: BetHistoryParams) => api.get<PaginatedResponse<Bet>>('/bets', { params }),
  getBetById: (id: string) => api.get<Bet>(`/bets/${id}`),
};
```

### Key Differences from Task Spec
- Type file already existed with enhanced structure (BetMatchInfo, BetSelectionItem nested types)
- Used existing type `Bet` instead of `BetResponse` (more specific)
- Used existing `PlaceBetResponse` which includes `duplicate` flag and `balance` info
- Added `BetHistoryParams` interface in service file (complements existing types)

### API Endpoints Used
- POST `/bets/place` - Place new bet (requires idempotencyKey to prevent duplicates)
- GET `/bets` - List user's bets with pagination and filtering
- GET `/bets/{id}` - Get specific bet details

### Verified
- TypeScript compilation passes for bet service and types
- Proper imports from `services/api.ts` and `@/types/bet`
- No `any` types used
- Follows existing frontend service pattern (wallet.service.ts, match.service.ts)

## Backend Bet Query API

### Methods Added to BetsService
1. **getUserBets(userId: string, query: QueryMyBetsDto)** 
   - Pagination: page, limit (defaults: 1, 20)
   - Filtering: by BetStatus enum, date range (fromDate/toDate)
   - Returns: { data: Bet[], meta: { total, page, limit, totalPages } }
   - Includes full selection details with odds and match info
   - Ordered by placedAt DESC (most recent first)

2. **getBetById(userId: string, betId: string)**
   - Throws NotFoundException if bet not found or doesn't belong to user
   - Returns full bet details with selections, odds, matches including league info
   - Supports authorization check: validates bet.userId matches request user

### Endpoints Added to BetsController
1. **GET /bets** - List user's bets
   - Uses QueryMyBetsDto for query params
   - Calls getUserBets()
   - Response: paginated list with metadata

2. **GET /bets/:id** - Get specific bet
   - Uses :id as betId path param
   - Calls getBetById()
   - Response: single bet with full details or 404

### Pattern Notes
- Extraction pattern: page/limit defaults match wallet.service.ts
- Promise.all() used for parallel count + findMany (pagination perf)
- Uses computed `where` object to conditionally add filters
- Date filtering creates placedAt object conditionally
- Ownership check on get-by-id prevents cross-user data access


## Frontend Bet History Page (Task 7)

### Created File
- `apps/web/src/app/bets/page.tsx` - Full bet history page with pagination, filtering, and status badges

### Page Features Implemented
1. **Authentication & Authorization**
   - Uses `useAuthStore` to check auth state
   - Auto-redirects unauthenticated users to home (`/`)
   - Proper async auth check with `checkAuth()`

2. **Data Fetching**
   - Uses `betService.getBets(params)` from `@/services/bet.service`
   - Axios response handling: `response.data as unknown as PaginatedResponse<Bet>`
   - Supports pagination with `page`, `limit` params
   - Supports status filtering with optional `status` param

3. **UI Components Used**
   - `Badge` from `@/components/ui/badge`
   - `Skeleton` from `@/components/ui/skeleton`
   - lucide-react icons: ArrowLeft, ChevronLeft, ChevronRight, Filter, Receipt

4. **Status Filtering**
   - Status options: All, Pending, Won, Lost, Void
   - Color-coded badges: yellow (pending), green (won), red (lost), gray (void), blue (partial_won), purple (cashout)
   - Filter resets pagination to page 1
   - Supports dark mode with tailwind dark: prefix classes

5. **States Managed**
   - Loading skeleton with 5-item placeholder
   - Empty state with icon and context-aware message
   - Bet list display with match details, selection info, odds, and payout info
   - Pagination controls (Previous/Next buttons) that disable at boundaries

6. **Bet Card Display**
   - Shows: Match name, Selection with odds, Status badge, Date, Stake, Potential/Actual win
   - Responsive design with truncation for long team names
   - Dark mode support throughout

7. **Formatting**
   - Currency: Vietnamese number format without currency symbol (format: "1.000.000 ₫")
   - Date: Vietnamese locale (dd/mm/yyyy hh:mm)
   - Odds: Fixed 2 decimal places

### Implementation Notes
- All text is in Vietnamese (UI language)
- Axios response structure: `response.data.data` for bet array, `response.data.meta` for pagination
- Uses `useCallback` for fetchBets to prevent infinite render loops
- Status filter changes reset to page 1
- Empty state shows different messages for filtered vs. no bets cases
- Pagination only shown if `totalPages > 1`

### Code Patterns Matched
- Follows wallet page structure (sticky header, back button, loading states)
- Uses same formatCurrency pattern as wallet (without style parameter for Vietnamese)
- Client component ('use client' directive)
- Zustorm store pattern for auth state
- No external dependencies added (uses existing components and services)


## Backend Bet Service Unit Tests (Task 8)

### Test Infrastructure Setup
- Installed Jest and @nestjs/testing: `pnpm add -D @nestjs/testing jest @types/jest ts-jest`
- Created `jest.config.js` in `apps/api/` with:
  - ts-jest transformer for TypeScript support
  - moduleNameMapper for @/ path alias
  - rootDir: 'src' for test discovery
  - testEnvironment: 'node'
- Updated `tsconfig.json` to include `"jest"` in types array
- Added test scripts to `apps/api/package.json`: `test` and `test:watch`

### Test File Structure (`bets.service.spec.ts`)
- **Location**: `apps/api/src/modules/bets/bets.service.spec.ts`
- **Test Count**: 37 test cases total (exceeds ≥15 requirement)
- **Test Groups**:
  1. `placeBet` (14 tests): Core bet placement logic
  2. `settleMatchBets` (9 tests): Settlement and result calculation
  3. `voidMatchBets` (4 tests): Bet voiding and refunds
  4. `getUserBets` (6 tests): Pagination and filtering
  5. `getBetById` (4 tests): Bet retrieval and access control

### Mock Setup Pattern
```typescript
const mockPrismaService = {
  bet: { findFirst, findMany, findUnique, count, create, update },
  betSelection: { findMany, update, updateMany, create },
  odds: { findUnique },
  wallet: { findUnique, update },
  match: { findUnique, findMany },
  transaction: { create },
  $transaction: jest.fn(),
};

const mockBettingLimitsService = {
  validateBetAmount: jest.fn(),
};

// Created TestingModule with mocked dependencies
const module = await Test.createTestingModule({
  providers: [
    BetsService,
    { provide: PrismaService, useValue: mockPrismaService },
    { provide: BettingLimitsService, useValue: mockBettingLimitsService },
  ],
}).compile();
```

### Test Coverage Highlights

#### placeBet (14 tests)
- Success: Valid inputs → bet created, wallet updated, transaction recorded
- Idempotency: Duplicate key returns existing bet without executing transaction
- Validation: Odds not found, odds suspended/closed, match not bettable
- Match Status: Throws on finished/cancelled/postponed
- Balance: Real balance split, bonus deduction, insufficient funds
- Limits: Betting limit validation with failing checks
- Wallet: Not found, balance calc with mixed real/bonus

#### settleMatchBets (9 tests)
- Match not found: Throws NotFoundException
- Match not finished: Throws BadRequestException with validation
- Finished match: Returns { settled, errors } count
- 1X2 Markets: Home win, away win, draw scenarios auto-settle
- Non-1X2 Markets: Over/Under skipped (stay pending)
- Cancelled/Postponed: Delegates to voidMatchBets

#### voidMatchBets (4 tests)
- Pending selections: Voided, stakes refunded proportionally (real/bonus split)
- No pending bets: Returns { settled: 0, errors: 0 }
- Deduplication: Handles multiple selections per bet (groups by betId)
- Skip settled: Ignores bets with status !== 'pending'

#### getUserBets (6 tests)
- Pagination: Default (page:1, limit:20), custom page/limit, totalPages calc
- Status filter: By BetStatus enum (pending, won, lost, void, etc.)
- Date range: fromDate/toDate with conditional where clauses
- Ordering: placedAt DESC (most recent first)
- Includes: Selections with odds (betType) and match (homeTeam, awayTeam)
- Promise.all: Parallel findMany + count for performance

#### getBetById (4 tests)
- Authorization: Throws NotFoundException if userId doesn't match
- Not found: Returns NotFoundException if betId doesn't exist
- Success: Returns full bet with selections, odds, match, league
- Includes: Deep include tree for odds.betType and match details

### Key Testing Patterns
1. **Mock Implementation for Transactions**: 
   ```typescript
   mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
     return callback(mockPrismaService);
   });
   ```

2. **Jest Matchers Used**:
   - `expect(result).toBeDefined()`
   - `expect(result.duplicate).toBe(true/false)`
   - `expect(fn).toHaveBeenCalled()`
   - `expect(fn).toHaveBeenCalledWith(expectedArgs)`
   - `expect(result.meta.totalPages).toBe(5)` for pagination

3. **Mock Reset**: `jest.clearAllMocks()` in beforeEach for test isolation

4. **Async/Await**: All async operations tested with `await expect().rejects.toThrow()`

### Test Verification
```bash
pnpm test -- bets.service.spec.ts --verbose
# Output: 37 passed in 1.925s
```

All major scenarios covered including:
- Happy path success cases
- Validation & error handling
- Balance calculations (real/bonus split)
- Pagination & filtering
- Authorization checks
- Atomic transaction patterns
