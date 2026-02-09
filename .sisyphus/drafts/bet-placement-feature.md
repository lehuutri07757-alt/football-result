# Draft: Bet Placement Feature (Cá cược từ Odds)

## Current State Assessment

### What EXISTS (Infrastructure Ready)
- **Prisma Schema**: Models `Bet`, `BetSelection`, `Odds`, `Wallet`, `Transaction` fully defined
- **Enums**: `BetStatus` (pending/won/lost/void/partial_won/cashout), `OddsStatus` (active/suspended/closed/settled), `SelectionResult`, `TransactionType` (bet_placed/bet_won/bet_refund)
- **Wallet Service**: Balance management (real/bonus/pending), transaction recording, $transaction for atomic ops
- **Betting Limits**: Full hierarchy (user → agent → parent agent → defaults), daily/weekly/monthly validation, `validateBetAmount()` ready to use
- **Frontend Betslip Store**: Zustand with persistence, add/remove/toggle selections, total odds calculation
- **Frontend Betslip UI**: FloatingBetSlip component showing selections, "Place Bet" button (non-functional)
- **Odds Display**: Bet365OddsTable, OddsTable components with selectable odds
- **Odds Sync**: External API sync populates Odds table

### What's MISSING (Needs Building)
- **Backend**: No bet module (no service, controller, DTOs)
- **Backend**: No bet placement logic (validate → deduct wallet → create bet + selections → record transaction)
- **Backend**: No bet settlement logic
- **Backend**: No bet history endpoints
- **Frontend**: No bet placement API service
- **Frontend**: No stake input UI in betslip
- **Frontend**: "Place Bet" button has no onClick handler
- **Frontend**: No bet confirmation/success flow
- **Frontend**: No bet history page for users
- **Frontend**: No error handling for bet placement failures

### Key Data Models

**Odds**: matchId, betTypeId, selection, selectionName, handicap, oddsValue, status
**Bet**: userId, betType (single/combo/system), stake, totalOdds, potentialWin, actualWin, status, ipAddress, deviceType
**BetSelection**: betId, oddsId, matchId, oddsValue (snapshot), selection, selectionName, handicap, result
**Wallet**: realBalance, bonusBalance, pendingBalance, currency (VND)
**Transaction**: walletId, type, amount, balanceBefore, balanceAfter, referenceType, referenceId

### Betslip Store Selection Shape
```typescript
BetSlipItem {
  id: string;          // fixtureId-market-selection
  fixtureId: number;   // Match ID (external)
  matchName: string;
  market: string;
  selection: string;
  odds: number;
  handicap?: string;
  addedAt: number;
}
```

**NOTE**: Frontend uses `fixtureId` (external API-Football ID), backend Odds uses internal UUID `matchId`. Need mapping.

### Betting Limits Defaults
- minBet: 10,000 VND
- maxBet: 10,000,000 VND
- dailyLimit: 100,000,000 VND
- weeklyLimit: 500,000,000 VND
- monthlyLimit: 2,000,000,000 VND

## Research Findings
- WalletService uses `$transaction` for atomic balance changes - bet placement must follow same pattern
- Transaction recording captures balanceBefore/balanceAfter with referenceType/referenceId - use 'bet' type
- BettingLimitsService.validateBetAmount() already aggregates daily/weekly/monthly totals from Bet table
- Match has `bettingEnabled` flag that should be checked

## Decisions (Confirmed)
- **Bet Types**: Single only (1 selection per bet)
- **Odds Change**: Accept any odds - always use latest odds at placement time
- **Settlement**: YES - include bet settlement when match finishes
- **Frontend Scope**: Full - stake input, place bet flow, confirmation, bet history page
- **Live Betting**: YES - support both pre-match and live betting

## Open Questions
- Balance priority: Use realBalance first, then bonusBalance? Or let user choose?
- Settlement trigger: Manual admin action or automatic when match finishes?

## Scope Boundaries
- INCLUDE: Backend bet module (place, settle, history), Frontend (betslip upgrade, bet history page, bet service)
- EXCLUDE: Combo/System bets, cashout feature, admin bet management panel (for now)
