# Bet Placement Feature - Work Plan

## TL;DR

> **Quick Summary**: Build a complete single-bet placement system from odds, including backend bet module (place + settle + history), frontend betslip upgrade with stake input, bet confirmation flow, and bet history page.
> 
> **Deliverables**:
> - Backend: `apps/api/src/modules/bets/` module (place bet, settle bets, bet history endpoints)
> - Frontend: Upgraded betslip with stake input + place bet API integration
> - Frontend: Bet confirmation/error handling flow
> - Frontend: Bet history page at `/bets`
> - Frontend: Bet service for API calls
> - Tests: Unit tests for bet service + settlement logic
> 
> **Estimated Effort**: Large (3-4 days)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 5 → Task 7 → Task 8

---

## Context

### Original Request
User wants to create a betting feature from odds - allowing users to place bets on matches using the existing odds system.

### Interview Summary
**Key Discussions**:
- **Bet Types**: Single bet only (1 selection per bet). No combo/accumulator/system.
- **Odds Handling**: Always use latest odds from DB at placement time (server-authoritative).
- **Settlement**: Automatic when match status changes to `finished`.
- **Balance Priority**: realBalance first, then bonusBalance if insufficient.
- **Live Betting**: Support both pre-match (scheduled) and live matches.
- **Frontend Scope**: Full - stake input, placement flow, confirmation, bet history page.
- **Test Strategy**: Tests after implementation + Agent-Executed QA.

**Research Findings**:
- Schema fully ready: `Bet`, `BetSelection`, `Odds`, `Wallet`, `Transaction` models exist with proper relations.
- All enums defined: `BetStatus`, `OddsStatus`, `SelectionResult`, `TransactionType`.
- `WalletService` uses `$transaction` for atomic ops - same pattern for bet placement.
- `BettingLimitsService.validateBetAmount()` validates min/max/daily/weekly/monthly limits.
- Match has `externalId` field (@@unique) for fixtureId→matchId mapping.
- Frontend betslip store manages selections but uses `fixtureId` (number) not internal `matchId` (UUID).
- `FloatingBetSlip` has non-functional "Place Bet" button.

### Gap Analysis (Oracle Review)
**Identified Gaps** (addressed):
- **fixtureId→matchId mapping**: Match.externalId provides this. Client sends `oddsId` only; server derives everything.
- **Supported markets**: MVP supports all markets that have odds in DB. Settlement only auto-resolves 1X2 (Match Winner) based on homeScore/awayScore. Other markets remain `pending` until admin resolves or future settlement logic is added.
- **Bonus balance rules**: Real first, then bonus. Winnings go to realBalance. Refunds go back to source (proportional). MVP: no wagering restrictions on bonus.
- **Idempotency**: Use client-generated idempotency key to prevent double-submit.
- **Settlement exactly-once**: Guard with status check - only settle bets with `pending` status and `pending` selection results.
- **Cancelled/postponed matches**: Void all pending bets and refund stakes.
- **Odds are updated in-place** (from API-Football sync), not versioned. `oddsValue` is snapshotted on `BetSelection` at placement time.

---

## Work Objectives

### Core Objective
Enable users to place single bets on match odds, automatically settle bets when matches finish, and view their betting history.

### Concrete Deliverables
- `apps/api/src/modules/bets/` - NestJS module with controller, service, DTOs
- `apps/api/src/modules/bets/bets.service.ts` - Bet placement + settlement + history logic
- `apps/api/src/modules/bets/bets.controller.ts` - REST endpoints
- `apps/api/src/modules/bets/dto/` - Request/response DTOs with validation
- `apps/web/src/services/bet.service.ts` - Frontend API client
- `apps/web/src/types/bet.ts` - Frontend TypeScript interfaces
- Updated `apps/web/src/stores/betslip.store.ts` - Stake management + placement state
- Updated `apps/web/src/components/mobile/FloatingBetSlip.tsx` - Stake input + functional Place Bet
- `apps/web/src/app/bets/page.tsx` - Bet history page
- Register `BetsModule` in `apps/api/src/app.module.ts`

### Definition of Done
- [ ] User can enter stake amount in betslip → click Place Bet → bet is created in DB
- [ ] Wallet balance is deducted atomically with bet creation
- [ ] Transaction record created with type `bet_placed`
- [ ] When match finishes, pending bets are auto-settled (1X2 market)
- [ ] Winning bets credit wallet with payout
- [ ] User can view bet history at `/bets`
- [ ] All validation works: odds suspended, match locked, insufficient funds, betting limits exceeded
- [ ] Unit tests pass for bet service
- [ ] `pnpm lint` passes

### Must Have
- Atomic wallet deduction + bet creation in single DB transaction
- Server-authoritative odds (ignore client-provided odds, use DB value)
- Idempotency key to prevent double-submit
- BettingLimits validation before placement
- Odds status check (must be `active`)
- Match bettingEnabled check
- Match status check (must be `scheduled` or `live`)
- Snapshot oddsValue on BetSelection at placement time
- Transaction recording with `balanceBefore`/`balanceAfter`
- Settlement for 1X2 market based on homeScore/awayScore
- Void + refund for cancelled/postponed matches
- Error responses with clear codes: `ODDS_SUSPENDED`, `MATCH_NOT_BETTABLE`, `INSUFFICIENT_FUNDS`, `LIMIT_EXCEEDED`, `DUPLICATE_BET`

### Must NOT Have (Guardrails)
- NO combo/accumulator/system bets - single only
- NO cashout or partial cashout
- NO odds change confirmation UX - always accept latest
- NO promotions/boosts/freebets/wagering requirements
- NO resettlement/corrections tooling
- NO admin bet management panel
- NO complex market settlement (corners, cards, player props) - only 1X2 auto-settlement
- NO real-time odds update via WebSocket in betslip (use DB value at placement)
- NO `any` types - use proper TypeScript types everywhere
- NO raw strings for status/types - use enums

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (project has test capabilities via NestJS testing utils)
- **Automated tests**: Tests after implementation
- **Framework**: NestJS built-in testing (@nestjs/testing) + Jest

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Every task includes QA scenarios. The executing agent DIRECTLY verifies
> by running commands, sending API requests, or using Playwright.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Backend API** | Bash (curl) | Send requests, parse responses, assert fields |
| **Frontend UI** | Playwright (playwright skill) | Navigate, interact, assert DOM, screenshot |
| **Database** | Bash (prisma studio / raw query) | Verify records created correctly |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Backend Bets Module - Bet Placement
├── Task 4: Frontend Bet Types + Bet Service
└── (independent: backend + frontend types/service can be done in parallel)

Wave 2 (After Wave 1):
├── Task 2: Backend Bet Settlement Logic
├── Task 3: Backend Bet History Endpoints
├── Task 5: Frontend Betslip Upgrade (stake input + place bet)
└── Task 6: Frontend Bet Confirmation Flow

Wave 3 (After Wave 2):
├── Task 7: Frontend Bet History Page
├── Task 8: Backend Unit Tests
└── Task 9: Integration Testing + Registration
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 5, 8, 9 | 4 |
| 2 | 1 | 8, 9 | 3, 5, 6 |
| 3 | 1 | 7, 8, 9 | 2, 5, 6 |
| 4 | None | 5, 6, 7 | 1 |
| 5 | 1, 4 | 6, 9 | 2, 3 |
| 6 | 5 | 9 | 2, 3 |
| 7 | 3, 4 | 9 | 8 |
| 8 | 1, 2, 3 | 9 | 7 |
| 9 | All (1-8) | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 4 | category="unspecified-high" (backend), category="quick" (frontend types) |
| 2 | 2, 3, 5, 6 | mixed backend + frontend tasks |
| 3 | 7, 8, 9 | frontend page + tests + integration |

---

## TODOs

- [ ] 1. Backend: Bets Module - Bet Placement Service + Controller + DTOs

  **What to do**:
  - Create `apps/api/src/modules/bets/` directory with standard NestJS module structure
  - Create DTOs:
    - `PlaceBetDto`: `oddsId` (string, required), `stake` (number, required), `idempotencyKey` (string, required)
    - `BetResponseDto`: betId, stake, oddsValue, totalOdds, potentialWin, status, selection details, balance after
  - Create `BetsService` with `placeBet(userId: string, dto: PlaceBetDto, ipAddress?: string)`:
    1. Check idempotency: query existing bet by idempotencyKey in metadata → return existing if found
    2. Fetch Odds by `oddsId` with relations (match, betType) → throw if not found
    3. Validate odds.status === `active` → throw `ODDS_SUSPENDED` if not
    4. Validate match.bettingEnabled === true → throw `MATCH_NOT_BETTABLE`
    5. Validate match.status is `scheduled` or `live` → throw `MATCH_NOT_BETTABLE`
    6. Call `BettingLimitsService.validateBetAmount(userId, stake)` → throw `LIMIT_EXCEEDED` if invalid
    7. Fetch wallet by userId
    8. Calculate balance: totalAvailable = realBalance + bonusBalance
    9. Validate totalAvailable >= stake → throw `INSUFFICIENT_FUNDS`
    10. Calculate split: realDeduction = min(stake, realBalance), bonusDeduction = stake - realDeduction
    11. Calculate potentialWin = stake * oddsValue
    12. Execute `prisma.$transaction()`:
        - Deduct wallet (realBalance -= realDeduction, bonusBalance -= bonusDeduction)
        - Create Bet record (betType: 'single', stake, totalOdds: oddsValue, potentialWin, status: pending, metadata: { idempotencyKey, realStake, bonusStake })
        - Create BetSelection record (oddsId, matchId, oddsValue snapshot, selection, selectionName, handicap)
        - Create Transaction record (type: bet_placed, amount: stake, balanceBefore, balanceAfter, referenceType: 'bet', referenceId: bet.id)
    13. Return bet details + updated balance
  - Create `BetsController`:
    - `POST /api/bets/place` - Place bet (requires JwtAuthGuard)
    - Use `@Request()` to get userId from `req.user.sub`
    - Extract IP from request headers
  - Create `BetsModule`:
    - Import PrismaModule, WalletModule, BettingLimitsModule
    - Register service + controller

  **Must NOT do**:
  - NO combo/system bet logic
  - NO direct wallet manipulation outside $transaction
  - NO trusting client-provided odds values
  - NO skipping any validation step

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex business logic with atomic transactions, multiple validations, and financial calculations
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commits after completing the task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 4)
  - **Blocks**: Tasks 2, 3, 5, 8, 9
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `apps/api/src/modules/wallet/wallet.service.ts:86-112` - Atomic $transaction pattern for balance changes with transaction recording
  - `apps/api/src/modules/wallet/wallet.service.ts:66-114` - adjustBalance pattern showing balanceBefore/balanceAfter capture
  - `apps/api/src/modules/betting-limits/betting-limits.service.ts:148-208` - validateBetAmount() method to call before placement
  - `apps/api/src/modules/deposits/` - Module structure pattern (module/controller/service/dto)

  **API/Type References**:
  - `apps/api/prisma/schema.prisma:415-446` - Bet model fields (stake, totalOdds, potentialWin, actualWin, status, metadata)
  - `apps/api/prisma/schema.prisma:448-473` - BetSelection model (oddsId, matchId, oddsValue snapshot, selection, result)
  - `apps/api/prisma/schema.prisma:386-413` - Odds model (matchId, betTypeId, selection, oddsValue, status)
  - `apps/api/prisma/schema.prisma:322-363` - Match model (externalId, status, bettingEnabled, homeScore, awayScore)
  - `apps/api/prisma/schema.prisma:43-50` - BetStatus enum
  - `apps/api/prisma/schema.prisma:61-66` - OddsStatus enum
  - `apps/api/prisma/schema.prisma:17-26` - TransactionType enum (bet_placed, bet_won, bet_refund)
  - `apps/api/prisma/schema.prisma:184-211` - Transaction model (referenceType, referenceId pattern)

  **Infrastructure References**:
  - `apps/api/src/app.module.ts` - Where to register BetsModule (add import)
  - `apps/api/src/modules/betting-limits/betting-limits.module.ts` - Module to import for BettingLimitsService
  - `apps/api/src/modules/wallet/wallet.service.ts` - WalletService to import (getWalletByUserId)

  **Auth References**:
  - `apps/api/src/modules/auth/` - JwtAuthGuard, how req.user.sub provides userId

  **Acceptance Criteria**:

  - [ ] File `apps/api/src/modules/bets/bets.module.ts` exists and exports BetsModule
  - [ ] File `apps/api/src/modules/bets/bets.service.ts` exists with `placeBet()` method
  - [ ] File `apps/api/src/modules/bets/bets.controller.ts` exists with `POST /bets/place` endpoint
  - [ ] File `apps/api/src/modules/bets/dto/place-bet.dto.ts` exists with class-validator decorators
  - [ ] BetsModule registered in `apps/api/src/app.module.ts` imports array
  - [ ] `pnpm lint` passes with no errors in bets module files

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Place bet successfully with valid odds
    Tool: Bash (curl)
    Preconditions: Dev server running (pnpm dev:api), test user authenticated, odds exist with active status, match is scheduled/live with bettingEnabled=true, user has sufficient balance
    Steps:
      1. Get auth token: POST /api/auth/login with test credentials → extract accessToken
      2. Get user wallet balance: GET /api/wallet/balance with Bearer token → note realBalance
      3. Get an active odds ID: Query DB or use known odds ID from seed data
      4. Place bet: POST /api/bets/place with body {"oddsId": "<id>", "stake": 50000, "idempotencyKey": "test-001"} and Bearer token
      5. Assert: HTTP status is 201
      6. Assert: response.data.status equals "pending"
      7. Assert: response.data.stake equals 50000
      8. Assert: response.data.potentialWin equals stake * oddsValue
      9. Check wallet: GET /api/wallet/balance → assert realBalance decreased by stake amount
    Expected Result: Bet created, wallet deducted, transaction recorded
    Evidence: Response bodies captured

  Scenario: Duplicate bet rejected by idempotency key
    Tool: Bash (curl)
    Preconditions: Previous scenario completed successfully
    Steps:
      1. Repeat same POST /api/bets/place with same idempotencyKey "test-001"
      2. Assert: HTTP status is 200 (returns existing bet, not 201)
      3. Assert: response.data.id equals the bet ID from first placement
      4. Check wallet: balance NOT deducted again
    Expected Result: Returns existing bet without double-charging
    Evidence: Response body showing same betId

  Scenario: Placement fails with insufficient funds
    Tool: Bash (curl)
    Preconditions: User wallet has less than requested stake
    Steps:
      1. Place bet with stake exceeding total available balance
      2. Assert: HTTP status is 400
      3. Assert: response.message contains "INSUFFICIENT_FUNDS" or "Insufficient"
    Expected Result: Bet not created, clear error message
    Evidence: Error response captured

  Scenario: Placement fails with suspended odds
    Tool: Bash (curl)
    Preconditions: Odds record with status = 'suspended'
    Steps:
      1. Place bet with suspended oddsId
      2. Assert: HTTP status is 400
      3. Assert: response.message contains "ODDS_SUSPENDED" or "suspended"
    Expected Result: Bet rejected with clear error
    Evidence: Error response captured
  ```

  **Commit**: YES
  - Message: `feat(bets): add bet placement service with validation and atomic wallet deduction`
  - Files: `apps/api/src/modules/bets/**`, `apps/api/src/app.module.ts`
  - Pre-commit: `pnpm lint`

---

- [ ] 2. Backend: Bet Settlement Logic

  **What to do**:
  - Add settlement methods to `BetsService`:
    - `settleMatchBets(matchId: string)`: Settle all pending bets for a finished match
      1. Fetch match with homeScore, awayScore, status
      2. Validate match.status is `finished` (or `cancelled`/`postponed` for void/refund)
      3. Find all BetSelections where matchId = matchId AND result = `pending`
      4. For each BetSelection:
         - Fetch related Odds with BetType
         - If BetType.code === 'match_winner' (1X2):
           - Determine result from homeScore vs awayScore:
             - Home win (homeScore > awayScore) → selection "Home" wins
             - Away win (awayScore > homeScore) → selection "Away" wins
             - Draw (homeScore === awayScore) → selection "Draw" wins
           - Update BetSelection.result to `won` or `lost`
         - For other market types: leave as `pending` (future settlement)
      5. For each Bet that has all selections resolved:
         - If all selections `won` → Bet.status = `won`, credit wallet (actualWin = potentialWin)
         - If any selection `lost` → Bet.status = `lost`
         - If any selection `void` → Bet.status = `void`, refund stake
      6. For won bets: Create transaction (type: bet_won, amount: potentialWin)
      7. For void/refund: Create transaction (type: bet_refund, amount: stake)
    - `voidMatchBets(matchId: string)`: Void all pending bets for cancelled/postponed match
      1. Set all pending BetSelection.result = `void`
      2. Set all pending Bet.status = `void`
      3. Refund stakes: credit wallet (realBalance/bonusBalance proportional to original split from metadata)
      4. Create transaction (type: bet_refund)
  - Add a `@Cron` or hook integration point that calls `settleMatchBets` when match status changes to `finished`
    - Option: Add to existing match sync flow in `api-football` module, or create a `@Cron('*/5 * * * *')` that checks for finished matches with unsettled bets

  **Must NOT do**:
  - NO complex market settlement (only 1X2 auto-settle)
  - NO double-settlement (guard with status check)
  - NO manual admin settlement UI (out of scope)
  - NO resettlement/corrections

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex settlement logic with financial calculations, multiple DB updates, and edge case handling
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commits

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 1)
  - **Parallel Group**: Wave 2 (with Tasks 3, 5, 6)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `apps/api/src/modules/bets/bets.service.ts` (from Task 1) - Bet placement service to extend
  - `apps/api/src/modules/wallet/wallet.service.ts:86-112` - $transaction pattern for crediting winnings
  - `apps/api/src/modules/api-football/odds-sync.service.ts` - Existing sync/cron pattern

  **API/Type References**:
  - `apps/api/prisma/schema.prisma:322-363` - Match model (homeScore, awayScore, status)
  - `apps/api/prisma/schema.prisma:52-59` - SelectionResult enum (pending, won, lost, void, half_won, half_lost)
  - `apps/api/prisma/schema.prisma:43-50` - BetStatus enum
  - `apps/api/prisma/schema.prisma:365-384` - BetType model (code field for market identification)

  **Acceptance Criteria**:

  - [ ] `settleMatchBets()` method exists in BetsService
  - [ ] `voidMatchBets()` method exists in BetsService
  - [ ] Settlement correctly resolves 1X2 market: Home win, Away win, Draw
  - [ ] Won bets credit wallet with potentialWin amount
  - [ ] Voided bets refund stake to original balance types
  - [ ] Settlement is idempotent - running twice produces same result
  - [ ] Cron job or hook triggers settlement for finished matches

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Settle winning 1X2 bet (Home win)
    Tool: Bash (curl + DB query)
    Preconditions: A bet exists with pending status on a match where homeScore > awayScore and match.status = 'finished'
    Steps:
      1. Note user wallet balance before settlement
      2. Trigger settlement (call endpoint or run cron manually)
      3. Query DB: SELECT status FROM bets WHERE id = '<betId>'
      4. Assert: bet status is 'won'
      5. Query DB: SELECT result FROM bet_selections WHERE bet_id = '<betId>'
      6. Assert: selection result is 'won'
      7. Check wallet balance: assert increased by potentialWin amount
      8. Query transactions: assert bet_won transaction exists with correct amount
    Expected Result: Bet settled as won, winnings credited
    Evidence: DB query results captured

  Scenario: Settle losing bet
    Tool: Bash (curl + DB query)
    Preconditions: Bet on "Home" but awayScore > homeScore, match finished
    Steps:
      1. Trigger settlement
      2. Assert: bet status is 'lost'
      3. Assert: wallet balance unchanged (no payout)
      4. Assert: no bet_won transaction created
    Expected Result: Bet marked as lost, no payout
    Evidence: DB query results

  Scenario: Void bets for cancelled match
    Tool: Bash (curl + DB query)
    Preconditions: Bet exists on a match with status 'cancelled'
    Steps:
      1. Note wallet balance before
      2. Trigger voidMatchBets
      3. Assert: bet status is 'void'
      4. Assert: wallet balance increased by original stake
      5. Assert: bet_refund transaction created
    Expected Result: Bet voided, stake refunded
    Evidence: DB query results

  Scenario: Settlement is idempotent
    Tool: Bash (curl)
    Preconditions: Bets already settled for a match
    Steps:
      1. Note wallet balance
      2. Trigger settlement again for same match
      3. Assert: wallet balance unchanged
      4. Assert: no new transactions created
    Expected Result: No double-settlement
    Evidence: Transaction count unchanged
  ```

  **Commit**: YES
  - Message: `feat(bets): add bet settlement and void logic for finished/cancelled matches`
  - Files: `apps/api/src/modules/bets/bets.service.ts`, settlement cron/hook file
  - Pre-commit: `pnpm lint`

---

- [ ] 3. Backend: Bet History + Query Endpoints

  **What to do**:
  - Create DTOs:
    - `QueryBetsDto`: page, limit, status (optional BetStatus filter), fromDate, toDate
    - `BetDetailDto`: Full bet response with selections, match info, odds info
  - Add methods to `BetsService`:
    - `getUserBets(userId: string, query: QueryBetsDto)`: Paginated bet history
      - Include relations: selections → odds → betType, selections → match (with teams)
      - Support filtering by status, date range
      - Return with pagination meta (total, page, limit, totalPages)
    - `getBetById(userId: string, betId: string)`: Single bet detail
      - Validate bet belongs to user
      - Include full relations
  - Add endpoints to `BetsController`:
    - `GET /api/bets` - List user's bets (paginated, filterable)
    - `GET /api/bets/:id` - Get single bet detail

  **Must NOT do**:
  - NO admin endpoints for viewing all users' bets
  - NO bet cancellation endpoint
  - NO skipping pagination

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard CRUD query patterns, straightforward Prisma queries with pagination
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commits

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 1)
  - **Parallel Group**: Wave 2 (with Tasks 2, 5, 6)
  - **Blocks**: Tasks 7, 8, 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `apps/api/src/modules/wallet/wallet.service.ts:213-236` - getBalanceHistory pagination pattern (skip/take, total count, meta response)
  - `apps/api/src/modules/transactions/transactions.service.ts` - Transaction query patterns with filters

  **API/Type References**:
  - `apps/api/prisma/schema.prisma:415-473` - Bet + BetSelection models with relations
  - `apps/api/prisma/schema.prisma:322-363` - Match model (for including team names in response)

  **Acceptance Criteria**:

  - [ ] `GET /api/bets` returns paginated list of user's bets
  - [ ] `GET /api/bets/:id` returns single bet with full details
  - [ ] Pagination works correctly (page, limit, total, totalPages)
  - [ ] Status filter works (e.g., `?status=pending`)
  - [ ] Date range filter works (fromDate, toDate)
  - [ ] Bet detail includes: match name (home vs away), market name, selection, odds at placement, stake, potential win, status

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Get bet history with pagination
    Tool: Bash (curl)
    Preconditions: User has multiple bets placed
    Steps:
      1. GET /api/bets?page=1&limit=5 with Bearer token
      2. Assert: HTTP status 200
      3. Assert: response.data is array with max 5 items
      4. Assert: response.meta.total >= 1
      5. Assert: response.meta.page equals 1
      6. Assert: each bet has: id, stake, totalOdds, potentialWin, status, placedAt, selections
    Expected Result: Paginated bet list returned
    Evidence: Response body captured

  Scenario: Filter bets by status
    Tool: Bash (curl)
    Steps:
      1. GET /api/bets?status=pending with Bearer token
      2. Assert: all returned bets have status "pending"
    Expected Result: Only pending bets returned
    Evidence: Response body

  Scenario: Get single bet detail
    Tool: Bash (curl)
    Steps:
      1. GET /api/bets/<betId> with Bearer token
      2. Assert: response includes selections array with match info and odds info
      3. Assert: each selection has matchName, market, selectionName, oddsValue
    Expected Result: Full bet detail returned
    Evidence: Response body
  ```

  **Commit**: YES
  - Message: `feat(bets): add bet history and detail query endpoints`
  - Files: `apps/api/src/modules/bets/bets.controller.ts`, `apps/api/src/modules/bets/bets.service.ts`, `apps/api/src/modules/bets/dto/query-bets.dto.ts`
  - Pre-commit: `pnpm lint`

---

- [ ] 4. Frontend: Bet Types + Bet Service

  **What to do**:
  - Create `apps/web/src/types/bet.ts`:
    ```typescript
    interface PlaceBetRequest { oddsId: string; stake: number; idempotencyKey: string; }
    interface BetResponse { id: string; stake: number; totalOdds: number; potentialWin: number; status: BetStatus; selections: BetSelectionResponse[]; placedAt: string; }
    interface BetSelectionResponse { id: string; matchName: string; market: string; selectionName: string; oddsValue: number; handicap?: number; result: string; }
    interface BetHistoryParams { page?: number; limit?: number; status?: string; fromDate?: string; toDate?: string; }
    enum BetStatus { PENDING = 'pending', WON = 'won', LOST = 'lost', VOID = 'void', PARTIAL_WON = 'partial_won', CASHOUT = 'cashout' }
    ```
  - Create `apps/web/src/services/bet.service.ts`:
    ```typescript
    const betService = {
      placeBet: (data: PlaceBetRequest) => api.post('/bets/place', data),
      getBets: (params: BetHistoryParams) => api.get('/bets', { params }),
      getBetById: (id: string) => api.get(`/bets/${id}`),
    };
    ```

  **Must NOT do**:
  - NO interfaces in service files - put in types/
  - NO direct axios calls - use `api` from `services/api.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple type definitions and service wrapper - 2 small files
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commits

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 5, 6, 7
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `apps/web/src/services/wallet.service.ts` - Service pattern using `api` client
  - `apps/web/src/services/match.service.ts` - Service with typed params
  - `apps/web/src/types/odds.ts` - Type definition pattern

  **API/Type References**:
  - `apps/web/src/services/api.ts` - Base API client to import

  **Acceptance Criteria**:

  - [ ] `apps/web/src/types/bet.ts` exists with all interfaces and BetStatus enum
  - [ ] `apps/web/src/services/bet.service.ts` exists with placeBet, getBets, getBetById methods
  - [ ] Imports use `api` from `services/api.ts`
  - [ ] No `any` types used

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Verify TypeScript compilation
    Tool: Bash
    Steps:
      1. Run: npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | head -20
      2. Assert: no errors in bet.ts or bet.service.ts files
    Expected Result: Clean TypeScript compilation
    Evidence: Command output
  ```

  **Commit**: YES
  - Message: `feat(web): add bet types and bet service for API integration`
  - Files: `apps/web/src/types/bet.ts`, `apps/web/src/services/bet.service.ts`
  - Pre-commit: `pnpm lint`

---

- [ ] 5. Frontend: Betslip Upgrade - Stake Input + Place Bet Flow

  **What to do**:
  - Update `apps/web/src/stores/betslip.store.ts`:
    - Add state: `stake: number`, `isPlacing: boolean`, `error: string | null`, `lastPlacedBet: BetResponse | null`
    - Add actions: `setStake(amount: number)`, `placeBet()`, `resetAfterPlacement()`
    - `placeBet()` logic:
      1. Set isPlacing = true, error = null
      2. Generate idempotencyKey (uuid)
      3. For each item in selections, call `betService.placeBet()` with the item's oddsId (need to add oddsId to BetSlipItem)
      4. On success: set lastPlacedBet, clear items
      5. On error: set error message from response
      6. Set isPlacing = false
  - Update `BetSlipItem` interface:
    - Add `oddsId: string` field (the internal Odds UUID - needed for API call)
    - Update `addSelection` and `toggleSelection` to accept oddsId
  - Update odds display components to pass `oddsId` when adding to betslip:
    - `apps/web/src/components/odds/Bet365OddsTable.tsx` - pass oddsId when calling toggleSelection
    - `apps/web/src/components/odds/OddsTable.tsx` - same
    - `apps/web/src/app/matches/[id]/page.tsx` - same
  - Update `apps/web/src/components/mobile/FloatingBetSlip.tsx`:
    - Add stake input field (number input with VND formatting)
    - Show potential payout (stake * totalOdds)
    - Add min/max stake hints
    - Connect "Place Bet" button onClick to `placeBet()` from store
    - Show loading state while placing
    - Show error message if placement fails
    - Disable button when stake is 0 or isPlacing

  **Must NOT do**:
  - NO combo bet logic (just place single bets, one per selection)
  - NO odds change detection UX
  - NO real-time balance check on frontend (backend validates)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI changes to betslip component with stake input, loading states, error display
  - **Skills**: [`frontend-ui-ux`, `git-master`]
    - `frontend-ui-ux`: Betslip UX with stake input, loading/error states, responsive design
    - `git-master`: For atomic commits

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Tasks 1 and 4)
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 6)
  - **Blocks**: Tasks 6, 9
  - **Blocked By**: Tasks 1, 4

  **References**:

  **Pattern References**:
  - `apps/web/src/stores/betslip.store.ts` - Current betslip store to extend (full file)
  - `apps/web/src/components/mobile/FloatingBetSlip.tsx` - Current betslip UI to upgrade (full file)
  - `apps/web/src/stores/auth.store.ts` - Zustand store pattern with async actions

  **API/Type References**:
  - `apps/web/src/types/bet.ts` (from Task 4) - PlaceBetRequest, BetResponse types
  - `apps/web/src/services/bet.service.ts` (from Task 4) - placeBet method to call

  **Component References**:
  - `apps/web/src/components/odds/Bet365OddsTable.tsx` - Odds display that needs oddsId pass-through
  - `apps/web/src/components/odds/OddsTable.tsx` - Alternative odds display
  - `apps/web/src/app/matches/[id]/page.tsx` - Match detail page odds display

  **Acceptance Criteria**:

  - [ ] BetSlipItem now includes `oddsId: string` field
  - [ ] Odds components pass `oddsId` to betslip store when user selects
  - [ ] FloatingBetSlip shows stake input field
  - [ ] Potential payout displays as stake × totalOdds
  - [ ] "Place Bet" button triggers API call
  - [ ] Loading spinner shows during placement
  - [ ] Error message displays on failure
  - [ ] Betslip clears after successful placement
  - [ ] Button disabled when stake is 0 or during placement

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Betslip shows stake input and calculates payout
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in, match with odds available
    Steps:
      1. Navigate to a match detail page with odds
      2. Click an odds button to add selection to betslip
      3. Click the floating betslip button to expand
      4. Assert: stake input field is visible
      5. Fill stake input with 100000
      6. Assert: potential payout displays (stake × odds value)
      7. Screenshot: .sisyphus/evidence/task-5-betslip-stake.png
    Expected Result: Betslip shows stake input with payout calculation
    Evidence: .sisyphus/evidence/task-5-betslip-stake.png

  Scenario: Place bet button triggers API call
    Tool: Playwright (playwright skill)
    Preconditions: User logged in with sufficient balance, selection added, stake entered
    Steps:
      1. Enter stake amount in betslip
      2. Click "Place Bet" button
      3. Wait for loading state (button shows spinner or disabled)
      4. Wait for success response (betslip clears or shows confirmation)
      5. Assert: betslip selections are cleared after success
      6. Screenshot: .sisyphus/evidence/task-5-bet-placed.png
    Expected Result: Bet placed successfully, betslip cleared
    Evidence: .sisyphus/evidence/task-5-bet-placed.png

  Scenario: Error display on insufficient funds
    Tool: Playwright (playwright skill)
    Preconditions: User with low balance
    Steps:
      1. Add selection, enter stake exceeding balance
      2. Click "Place Bet"
      3. Wait for error message to appear
      4. Assert: error message visible with "insufficient" text
      5. Assert: betslip NOT cleared (selections still there)
      6. Screenshot: .sisyphus/evidence/task-5-bet-error.png
    Expected Result: Error shown, betslip preserved
    Evidence: .sisyphus/evidence/task-5-bet-error.png
  ```

  **Commit**: YES
  - Message: `feat(web): upgrade betslip with stake input and place bet functionality`
  - Files: `apps/web/src/stores/betslip.store.ts`, `apps/web/src/components/mobile/FloatingBetSlip.tsx`, odds components
  - Pre-commit: `pnpm lint`

---

- [ ] 6. Frontend: Bet Confirmation Flow

  **What to do**:
  - Create a bet confirmation dialog/modal component:
    - Show after successful bet placement
    - Display: bet details (match, market, selection, odds used, stake, potential payout)
    - "View Bet History" button → navigate to `/bets`
    - "Place Another Bet" button → close dialog
    - Auto-dismiss after 5 seconds option
  - Update `FloatingBetSlip`:
    - After successful placement, show confirmation dialog
    - Update wallet balance display if visible anywhere in header/nav
  - Handle specific error codes with user-friendly messages:
    - `ODDS_SUSPENDED` → "Kèo đã tạm ngưng. Vui lòng chọn kèo khác."
    - `MATCH_NOT_BETTABLE` → "Trận đấu không cho phép đặt cược."
    - `INSUFFICIENT_FUNDS` → "Số dư không đủ. Vui lòng nạp thêm tiền."
    - `LIMIT_EXCEEDED` → "Vượt quá giới hạn cược. Kiểm tra hạn mức của bạn."
    - `DUPLICATE_BET` → Show existing bet details

  **Must NOT do**:
  - NO complex animation/transition (keep it simple)
  - NO multiple language support (Vietnamese only for error messages is fine for MVP)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI modal component with good UX for confirmation and error display
  - **Skills**: [`frontend-ui-ux`, `git-master`]
    - `frontend-ui-ux`: Confirmation dialog UX, error message display
    - `git-master`: For atomic commits

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 5)
  - **Parallel Group**: Wave 2 (with Tasks 2, 3)
  - **Blocks**: Task 9
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `apps/web/src/components/ui/` - shadcn/ui dialog/modal components to use
  - `apps/web/src/components/mobile/FloatingBetSlip.tsx` - Component to integrate with

  **API/Type References**:
  - `apps/web/src/types/bet.ts` (from Task 4) - BetResponse for displaying confirmation details

  **Acceptance Criteria**:

  - [ ] Confirmation dialog appears after successful bet placement
  - [ ] Dialog shows: match name, market, selection, odds, stake, potential payout
  - [ ] "View Bet History" button navigates to /bets
  - [ ] "Place Another Bet" button closes dialog
  - [ ] Error messages display in Vietnamese for all error codes
  - [ ] Dialog auto-dismisses after 5 seconds (optional)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Confirmation dialog after successful bet
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in with balance
    Steps:
      1. Navigate to match page, select odds, enter stake
      2. Click "Place Bet"
      3. Wait for confirmation dialog to appear (timeout: 10s)
      4. Assert: dialog shows match name
      5. Assert: dialog shows stake amount
      6. Assert: dialog shows potential payout
      7. Assert: "View Bet History" button visible
      8. Screenshot: .sisyphus/evidence/task-6-confirmation.png
    Expected Result: Confirmation dialog with bet details
    Evidence: .sisyphus/evidence/task-6-confirmation.png

  Scenario: Error message in Vietnamese for insufficient funds
    Tool: Playwright (playwright skill)
    Steps:
      1. Enter very high stake, click "Place Bet"
      2. Wait for error message
      3. Assert: error text contains "Số dư không đủ" or similar Vietnamese text
      4. Screenshot: .sisyphus/evidence/task-6-error-vn.png
    Expected Result: Vietnamese error message displayed
    Evidence: .sisyphus/evidence/task-6-error-vn.png
  ```

  **Commit**: YES
  - Message: `feat(web): add bet confirmation dialog and Vietnamese error messages`
  - Files: New confirmation component, updated FloatingBetSlip
  - Pre-commit: `pnpm lint`

---

- [ ] 7. Frontend: Bet History Page

  **What to do**:
  - Create `apps/web/src/app/bets/page.tsx`:
    - Page title: "Lịch sử cá cược" or "Bet History"
    - Filter bar: status dropdown (All, Pending, Won, Lost, Void), date range picker
    - Bet list: cards or table showing each bet
      - Match name (home vs away)
      - Market + selection + odds at placement
      - Stake amount + potential/actual payout
      - Status badge (color-coded: pending=yellow, won=green, lost=red, void=gray)
      - Placed date/time
    - Pagination controls (previous/next page)
    - Empty state when no bets
    - Loading skeleton while fetching
    - Click on bet → expand to show full details (inline accordion or navigate to detail)
  - Use `betService.getBets()` from Task 4

  **Must NOT do**:
  - NO complex analytics/charts
  - NO export to CSV/PDF
  - NO admin view of other users' bets

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: New page with filter bar, data table, pagination, status badges, loading states
  - **Skills**: [`frontend-ui-ux`, `git-master`]
    - `frontend-ui-ux`: Page layout, status badges, responsive design, loading skeletons
    - `git-master`: For atomic commits

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Tasks 3 and 4)
  - **Parallel Group**: Wave 3 (with Task 8)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `apps/web/src/app/wallet/` - Wallet page pattern (similar paginated history with filters)
  - `apps/web/src/app/dashboard/` - Dashboard page layout pattern
  - `apps/web/src/components/ui/` - shadcn/ui components (Badge, Table, Select, Skeleton)

  **API/Type References**:
  - `apps/web/src/services/bet.service.ts` (from Task 4) - getBets, getBetById
  - `apps/web/src/types/bet.ts` (from Task 4) - BetResponse, BetHistoryParams, BetStatus

  **Acceptance Criteria**:

  - [ ] Page accessible at `/bets`
  - [ ] Shows paginated list of user's bets
  - [ ] Status filter dropdown works
  - [ ] Each bet shows: match name, market, selection, odds, stake, potential/actual win, status badge, date
  - [ ] Status badges are color-coded (pending=yellow, won=green, lost=red, void=gray)
  - [ ] Pagination controls work (previous/next)
  - [ ] Loading skeleton shows while fetching
  - [ ] Empty state shows when no bets
  - [ ] Protected route (requires authentication)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Bet history page loads with bets
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in with placed bets
    Steps:
      1. Navigate to: http://localhost:3000/bets
      2. Wait for page to load (skeleton disappears, data visible)
      3. Assert: page title visible
      4. Assert: at least 1 bet card/row visible
      5. Assert: each bet shows match name, stake, odds, status
      6. Assert: status badges are color-coded
      7. Screenshot: .sisyphus/evidence/task-7-bet-history.png
    Expected Result: Bet history page with bet list
    Evidence: .sisyphus/evidence/task-7-bet-history.png

  Scenario: Filter by status works
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to /bets
      2. Click status filter dropdown
      3. Select "Pending"
      4. Wait for list to update
      5. Assert: all visible bets have "pending" status badge
      6. Screenshot: .sisyphus/evidence/task-7-filter-pending.png
    Expected Result: Only pending bets shown
    Evidence: .sisyphus/evidence/task-7-filter-pending.png

  Scenario: Empty state when no bets match filter
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to /bets
      2. Filter by a status with no matching bets (e.g., "cashout")
      3. Assert: empty state message visible
      4. Screenshot: .sisyphus/evidence/task-7-empty-state.png
    Expected Result: Empty state displayed
    Evidence: .sisyphus/evidence/task-7-empty-state.png

  Scenario: Pagination works
    Tool: Playwright (playwright skill)
    Preconditions: User has more than 10 bets
    Steps:
      1. Navigate to /bets
      2. Assert: pagination controls visible
      3. Click "Next" page
      4. Assert: different set of bets displayed
      5. Assert: page indicator updates
    Expected Result: Pagination navigates between pages
    Evidence: Screenshot captured
  ```

  **Commit**: YES
  - Message: `feat(web): add bet history page with filters and pagination`
  - Files: `apps/web/src/app/bets/page.tsx`
  - Pre-commit: `pnpm lint`

---

- [ ] 8. Backend: Unit Tests for Bet Service

  **What to do**:
  - Create `apps/api/src/modules/bets/bets.service.spec.ts`:
    - Mock PrismaService, WalletService, BettingLimitsService
    - Test `placeBet()`:
      - Happy path: valid odds, sufficient balance → bet created
      - Idempotency: duplicate key → returns existing bet
      - Odds suspended → throws ODDS_SUSPENDED
      - Match not bettable → throws MATCH_NOT_BETTABLE
      - Insufficient funds → throws INSUFFICIENT_FUNDS
      - Limits exceeded → throws LIMIT_EXCEEDED
      - Balance split: real+bonus when real insufficient
    - Test `settleMatchBets()`:
      - Home win: correct selection wins
      - Away win: correct selection wins
      - Draw: correct selection wins
      - Lost bet: no payout
      - Idempotent: already settled → no double pay
    - Test `voidMatchBets()`:
      - Void + refund for cancelled match
      - Already voided → no action
    - Test `getUserBets()`:
      - Returns paginated results
      - Filters by status

  **Must NOT do**:
  - NO integration tests with real DB (unit tests with mocks only)
  - NO testing framework setup (use existing NestJS testing utils)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex test mocking for $transaction, multiple edge cases for financial logic
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commits

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Tasks 1, 2, 3)
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `apps/api/src/modules/bets/bets.service.ts` (from Tasks 1-3) - Service under test

  **Test References**:
  - NestJS testing docs: `@nestjs/testing` Test.createTestingModule pattern

  **Acceptance Criteria**:

  - [ ] Test file exists at `apps/api/src/modules/bets/bets.service.spec.ts`
  - [ ] All placeBet scenarios covered (happy path + 5 error cases)
  - [ ] All settlement scenarios covered (win/lose/draw/void/idempotent)
  - [ ] All tests pass: `npx jest apps/api/src/modules/bets/bets.service.spec.ts`
  - [ ] Minimum 15 test cases

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All unit tests pass
    Tool: Bash
    Steps:
      1. Run: npx jest apps/api/src/modules/bets/bets.service.spec.ts --verbose
      2. Assert: exit code 0
      3. Assert: all test suites pass
      4. Assert: >= 15 test cases
    Expected Result: All tests green
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `test(bets): add unit tests for bet placement, settlement, and history`
  - Files: `apps/api/src/modules/bets/bets.service.spec.ts`
  - Pre-commit: `npx jest apps/api/src/modules/bets/bets.service.spec.ts`

---

- [ ] 9. Integration: End-to-End Verification + Final Cleanup

  **What to do**:
  - Verify BetsModule is registered in AppModule
  - Run full `pnpm lint` across workspace
  - Run full test suite
  - Verify end-to-end flow:
    1. Start dev servers (api + web)
    2. Login as test user
    3. Navigate to match with odds
    4. Select an odds value → appears in betslip
    5. Enter stake → see potential payout
    6. Click "Place Bet" → see confirmation
    7. Navigate to /bets → see the bet in history
    8. Verify wallet balance decreased
  - Fix any integration issues found
  - Verify settlement cron/hook is properly scheduled

  **Must NOT do**:
  - NO new features
  - NO refactoring beyond fixing integration issues

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: End-to-end verification requires running multiple services and checking full flow
  - **Skills**: [`playwright`, `git-master`]
    - `playwright`: Browser-based E2E verification
    - `git-master`: For final integration commit if needed

  **Parallelization**:
  - **Can Run In Parallel**: NO (final task)
  - **Parallel Group**: Sequential (after all others)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 1-8

  **References**:

  All previous task outputs.

  **Acceptance Criteria**:

  - [ ] `pnpm lint` passes with zero errors
  - [ ] Unit tests pass
  - [ ] Full E2E flow works: select odds → enter stake → place bet → see confirmation → view in history
  - [ ] Wallet balance correctly reflects bet placement
  - [ ] No console errors in browser or API server

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full end-to-end bet placement flow
    Tool: Playwright (playwright skill)
    Preconditions: Both dev servers running (api:3001, web:3000), test user with balance
    Steps:
      1. Navigate to http://localhost:3000/login
      2. Login with test credentials
      3. Navigate to a match detail page with active odds
      4. Click an odds button (e.g., Home win in 1X2 market)
      5. Assert: floating betslip appears with selection
      6. Expand betslip, enter stake: 50000
      7. Assert: potential payout displayed
      8. Click "Place Bet"
      9. Wait for confirmation dialog (timeout: 10s)
      10. Assert: confirmation shows correct match, odds, stake, payout
      11. Click "View Bet History"
      12. Assert: navigated to /bets
      13. Assert: placed bet visible in list with "pending" status
      14. Screenshot: .sisyphus/evidence/task-9-e2e-complete.png
    Expected Result: Full flow works end-to-end
    Evidence: .sisyphus/evidence/task-9-e2e-complete.png

  Scenario: Lint and tests pass
    Tool: Bash
    Steps:
      1. Run: pnpm lint
      2. Assert: exit code 0
      3. Run: npx jest apps/api/src/modules/bets/ --verbose
      4. Assert: all tests pass
    Expected Result: Clean codebase
    Evidence: Command output
  ```

  **Commit**: YES (if any fixes needed)
  - Message: `chore(bets): integration fixes and E2E verification`
  - Pre-commit: `pnpm lint`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `feat(bets): add bet placement service with validation and atomic wallet deduction` | `apps/api/src/modules/bets/**`, `app.module.ts` | `pnpm lint` |
| 2 | `feat(bets): add bet settlement and void logic for finished/cancelled matches` | `bets.service.ts`, cron file | `pnpm lint` |
| 3 | `feat(bets): add bet history and detail query endpoints` | `bets.controller.ts`, DTOs | `pnpm lint` |
| 4 | `feat(web): add bet types and bet service for API integration` | `types/bet.ts`, `services/bet.service.ts` | `pnpm lint` |
| 5 | `feat(web): upgrade betslip with stake input and place bet functionality` | `betslip.store.ts`, `FloatingBetSlip.tsx`, odds components | `pnpm lint` |
| 6 | `feat(web): add bet confirmation dialog and Vietnamese error messages` | confirmation component, FloatingBetSlip | `pnpm lint` |
| 7 | `feat(web): add bet history page with filters and pagination` | `app/bets/page.tsx` | `pnpm lint` |
| 8 | `test(bets): add unit tests for bet placement, settlement, and history` | `bets.service.spec.ts` | `jest` |
| 9 | `chore(bets): integration fixes and E2E verification` | various | `pnpm lint` + `jest` |

---

## Success Criteria

### Verification Commands
```bash
pnpm lint                    # Expected: 0 errors
npx jest apps/api/src/modules/bets/ --verbose  # Expected: all tests pass
pnpm dev                     # Expected: both servers start without errors
```

### Final Checklist
- [ ] User can place a single bet from odds
- [ ] Wallet atomically deducted with transaction recording
- [ ] Idempotency prevents double-submit
- [ ] All validations work (odds, match, limits, balance)
- [ ] Bet settlement auto-triggers for finished matches (1X2 market)
- [ ] Cancelled/postponed matches void bets and refund stakes
- [ ] Frontend betslip has functional stake input + Place Bet button
- [ ] Confirmation dialog shows after successful placement
- [ ] Vietnamese error messages for all failure cases
- [ ] Bet history page shows paginated, filterable bet list
- [ ] Unit tests cover all critical paths (≥15 test cases)
- [ ] `pnpm lint` passes
- [ ] No `any` types used
- [ ] All enums used instead of raw strings
