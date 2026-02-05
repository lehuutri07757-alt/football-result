# Team Detail Page

## TL;DR

> **Quick Summary**: Tạo trang public `/teams/[id]` hiển thị thông tin chi tiết team với 4 sections: team info, upcoming matches, match history, và basic stats. Cần thêm backend endpoint cho team matches và tạo frontend service + page component.
> 
> **Deliverables**:
> - Backend: `GET /teams/:id/matches` endpoint
> - Frontend: `teams.service.ts` service file
> - Frontend: `/teams/[id]/page.tsx` detail page
> 
> **Estimated Effort**: Medium (4-6 hours)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 (backend) → Task 3 (page component)

---

## Context

### Original Request
User requested: "làm cho tôi trang /teams/3dcc4ac9-e486-4757-8d21-c482406ffbb0" - Create a team detail page at `/teams/[id]`

### Interview Summary
**Key Discussions**:
- **Sections requested**: Team info (logo, name, country, sport), upcoming matches, match history, basic stats
- **UI level**: MVP - Basic functional (không cần full production UI)
- **Verification**: Manual với Playwright browser automation

**Research Findings**:
- Backend `GET /teams/:id` exists - trả về team với sport relation và match counts (nhưng không có match list)
- Frontend không có `teams.service.ts` - cần tạo mới
- Pattern từ `/matches/[id]/page.tsx`: 'use client', useParams, useState, useEffect, service call

### Metis Review
**Identified Gaps** (addressed):
- **Backend endpoint missing**: Cần `GET /teams/:id/matches` để lấy danh sách matches của team (server-side filtering thay vì client-side)
- **Stats computation unclear**: Sẽ tính W/D/L/Goals từ finished matches đã lưu trong DB
- **Edge cases**: Team không có logo, inactive teams, empty match lists

---

## Work Objectives

### Core Objective
Tạo trang public hiển thị chi tiết team với thông tin cơ bản và danh sách trận đấu.

### Concrete Deliverables
- `apps/api/src/modules/teams/teams.controller.ts` - Thêm endpoint `GET /teams/:id/matches`
- `apps/api/src/modules/teams/teams.service.ts` - Thêm method `findTeamMatches()`
- `apps/web/src/services/teams.service.ts` - Frontend service mới
- `apps/web/src/app/teams/[id]/page.tsx` - Team detail page component

### Definition of Done
- [ ] Navigate to `/teams/{uuid}` hiển thị team info đúng
- [ ] Hiển thị danh sách upcoming matches (max 5)
- [ ] Hiển thị match history (max 10 finished matches)
- [ ] Hiển thị stats cơ bản (W/D/L, total goals)
- [ ] Loading skeleton khi đang fetch
- [ ] Error state khi team không tồn tại (404)
- [ ] Empty states cho từng section

### Must Have
- Team header với logo, name, country, sport
- Upcoming matches section (scheduled status, max 5)
- Match history section (finished status, max 10)
- Basic stats: wins, draws, losses, goals for/against
- Loading skeleton
- Error handling (404, network error)
- Empty states

### Must NOT Have (Guardrails)
- ❌ Admin CRUD features (edit, delete, toggle active)
- ❌ Player roster / squad list (không có model Player)
- ❌ Advanced stats (xG, possession, streaks, form)
- ❌ Competition/season filters
- ❌ Infinite scroll / virtualization
- ❌ Betting odds integration
- ❌ New Zustand store (không cần global state)
- ❌ SEO optimization (MVP là client component)
- ❌ Related/similar teams suggestions
- ❌ Date range picker

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (không có test setup cho frontend pages)
- **User wants tests**: Manual-only
- **Framework**: none

### Automated Verification (Agent-Executable)

**For Backend endpoint** (using Bash curl):
```bash
# Agent runs after Task 1:
curl -sS "http://localhost:3001/teams/{TEAM_ID}/matches?type=upcoming&limit=5" | jq '.data | type'
# Assert: Output is "array"

curl -sS "http://localhost:3001/teams/{TEAM_ID}/matches?type=finished&limit=10" | jq '.data | type'
# Assert: Output is "array"
```

**For Frontend page** (using playwright skill):
```
# Agent executes via playwright browser automation after Task 3:
1. Navigate to: http://localhost:3000/teams/{TEAM_ID}
2. Wait for: selector containing team name to be visible (no loading skeleton)
3. Assert: Team name text is visible
4. Assert: "Trận đấu sắp tới" section heading exists
5. Assert: "Lịch sử trận đấu" section heading exists
6. Assert: "Thống kê" section heading exists
7. Screenshot: .sisyphus/evidence/team-detail-success.png
```

**For 404 handling** (using playwright skill):
```
1. Navigate to: http://localhost:3000/teams/does-not-exist-uuid
2. Wait for: error message to be visible
3. Assert: Page shows "not found" or error message
4. Screenshot: .sisyphus/evidence/team-detail-404.png
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Backend - Add team matches endpoint
└── Task 2: Frontend - Create teams.service.ts

Wave 2 (After Wave 1):
└── Task 3: Frontend - Create team detail page
└── Task 4: Manual verification with Playwright

Critical Path: Task 1 → Task 3 → Task 4
Parallel Speedup: ~30% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 4 | None |
| 4 | 3 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | delegate_task(category="quick", run_in_background=true) x2 |
| 2 | 3 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"]) |
| 3 | 4 | delegate_task with playwright skill |

---

## TODOs

- [ ] 1. Backend: Add team matches endpoint

  **What to do**:
  - Add new endpoint `GET /teams/:id/matches` to `teams.controller.ts`
  - Add method `findTeamMatches(id, query)` to `teams.service.ts`
  - Query params: `type` (upcoming | finished), `limit` (default 10)
  - Filter matches where `homeTeamId = id OR awayTeamId = id`
  - For upcoming: `status = 'scheduled'`, order by `startTime ASC`
  - For finished: `status = 'finished'`, order by `startTime DESC`
  - Include relations: league, homeTeam, awayTeam

  **Must NOT do**:
  - Don't add pagination (MVP chỉ cần limit)
  - Don't add date range filters
  - Don't change existing endpoints

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file changes, clear pattern from existing code
  - **Skills**: none needed
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed - not committing yet

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References** (CRITICAL):
  
  **Pattern References**:
  - `apps/api/src/modules/teams/teams.controller.ts:12-31` - Existing endpoint patterns (GET routes, params, Query decorators)
  - `apps/api/src/modules/teams/teams.service.ts:77-93` - `findOne()` method pattern for team fetching
  - `apps/api/src/modules/matches/matches.service.ts` - Match query patterns (if exists)

  **API/Type References**:
  - `apps/api/prisma/schema.prisma:317-358` - Match model với status enum, homeTeamId, awayTeamId
  - `apps/api/prisma/schema.prisma:290-315` - Team model với homeMatches[], awayMatches[] relations

  **WHY Each Reference Matters**:
  - Controller pattern shows how to add Swagger decorators và route params
  - Service findOne() shows NotFoundException pattern
  - Match model shows status enum values và team relations

  **Acceptance Criteria**:

  **Automated Verification (using Bash curl)**:
  ```bash
  # Start dev server first if not running
  # Test upcoming matches
  curl -sS "http://localhost:3001/teams/3dcc4ac9-e486-4757-8d21-c482406ffbb0/matches?type=upcoming&limit=5" | jq '.data | type'
  # Assert: Output is "array"
  # Assert: HTTP status 200
  
  # Test finished matches
  curl -sS "http://localhost:3001/teams/3dcc4ac9-e486-4757-8d21-c482406ffbb0/matches?type=finished&limit=10" | jq '.data | type'
  # Assert: Output is "array"
  
  # Test 404 for non-existent team
  curl -sS -o /dev/null -w "%{http_code}\n" "http://localhost:3001/teams/00000000-0000-0000-0000-000000000000/matches"
  # Assert: Output is "404"
  ```

  **Commit**: NO (groups with Task 3)

---

- [ ] 2. Frontend: Create teams.service.ts

  **What to do**:
  - Create new file `apps/web/src/services/teams.service.ts`
  - Define Team interface matching backend response
  - Define TeamMatch interface for match list items
  - Implement methods:
    - `getById(id: string): Promise<Team>`
    - `getMatches(id: string, type: 'upcoming' | 'finished', limit?: number): Promise<TeamMatch[]>`
  - Follow existing service patterns (api.get with proper typing)

  **Must NOT do**:
  - Don't add CRUD methods (create, update, delete)
  - Don't add admin-only methods (toggleActive)
  - Don't add pagination support

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file creation, following established patterns
  - **Skills**: none needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References** (CRITICAL):

  **Pattern References**:
  - `apps/web/src/services/match.service.ts:1-50` - Service file structure, interface definitions, api import
  - `apps/web/src/services/admin.service.ts:1-30` - Interface patterns for complex objects
  - `apps/web/src/services/api.ts` - Base api instance để import

  **API/Type References**:
  - `apps/api/src/modules/teams/teams.service.ts:77-93` - Response shape từ findOne()
  - `apps/api/prisma/schema.prisma:290-315` - Team fields: id, name, shortName, slug, logoUrl, country, countryCode, sportId

  **WHY Each Reference Matters**:
  - match.service.ts shows exact file structure và api.get pattern
  - admin.service.ts shows interface patterns cho nested objects (sport, counts)
  - Schema shows all Team fields cần define trong interface

  **Acceptance Criteria**:

  **Automated Verification (using Bash node)**:
  ```bash
  # Check file exists and exports correctly
  cat apps/web/src/services/teams.service.ts | grep -E "export (interface|const|function)" | head -5
  # Assert: Contains "export interface Team" 
  # Assert: Contains "export const teamsService"
  
  # TypeScript compilation check
  cd apps/web && npx tsc --noEmit src/services/teams.service.ts 2>&1 | head -5
  # Assert: No errors (or empty output)
  ```

  **Commit**: NO (groups with Task 3)

---

- [ ] 3. Frontend: Create team detail page

  **What to do**:
  - Create directory `apps/web/src/app/teams/[id]/`
  - Create `page.tsx` with:
    - 'use client' directive
    - useParams to get team ID
    - useState for team, upcomingMatches, finishedMatches, stats, loading, error
    - useEffect to fetch all data on mount
    - TeamHeader component (logo, name, country, sport badge)
    - UpcomingMatchesSection (list of max 5 matches)
    - MatchHistorySection (list of max 10 finished matches)
    - StatsSection (W/D/L computed from finished matches, goals for/against)
    - Loading skeleton (follow MatchSkeleton pattern)
    - Error state with retry button
    - Empty states for each section

  **Stats computation logic**:
  ```typescript
  // For each finished match:
  // - If team is homeTeam: homeScore vs awayScore
  // - If team is awayTeam: awayScore vs homeScore
  // Win: teamScore > opponentScore
  // Draw: teamScore === opponentScore
  // Loss: teamScore < opponentScore
  // Goals For: sum of teamScore
  // Goals Against: sum of opponentScore
  ```

  **Must NOT do**:
  - Don't add edit/delete buttons
  - Don't add betting odds display
  - Don't add player roster
  - Don't use server components (MVP is client-only)
  - Don't add complex animations

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend page với UI components, cần attention to UX
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Helps with component structure và UI patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Wave 1)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1, Task 2

  **References** (CRITICAL):

  **Pattern References**:
  - `apps/web/src/app/matches/[id]/page.tsx:1-100` - Detail page structure: imports, state management, fetchData pattern
  - `apps/web/src/app/matches/[id]/page.tsx:571-591` - MatchSkeleton component pattern
  - `apps/web/src/app/matches/[id]/page.tsx:176-208` - Loading/error/success conditional rendering pattern

  **UI Component References**:
  - `apps/web/src/components/ui/card.tsx` - Card, CardContent, CardHeader components
  - `apps/web/src/components/ui/skeleton.tsx` - Skeleton component for loading
  - `apps/web/src/components/ui/button.tsx` - Button for retry action

  **Icon References**:
  - `lucide-react` - Icons used: ChevronLeft, AlertCircle, RefreshCw (from matches page)

  **Service References**:
  - `apps/web/src/services/teams.service.ts` - teamsService.getById(), teamsService.getMatches() (created in Task 2)

  **WHY Each Reference Matters**:
  - matches/[id]/page.tsx is THE primary pattern - copy structure exactly
  - Skeleton pattern shows loading state approach
  - UI components ensure consistent look with rest of app

  **Acceptance Criteria**:

  **Automated Verification (using playwright skill)**:
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:3000/teams/3dcc4ac9-e486-4757-8d21-c482406ffbb0
  2. Wait for: loading skeleton to disappear (max 10s)
  3. Assert: Team name heading is visible
  4. Assert: Element with text "Trận đấu sắp tới" or "Upcoming Matches" exists
  5. Assert: Element with text "Lịch sử" or "History" exists
  6. Assert: Element with text "Thống kê" or "Stats" exists
  7. Assert: No console errors
  8. Screenshot: .sisyphus/evidence/task-3-team-detail.png
  ```

  **Empty state verification**:
  ```
  # If team has no upcoming matches:
  1. Assert: Empty state message like "Không có trận đấu" is visible
  2. Assert: Page does not crash or show error
  ```

  **404 verification**:
  ```
  1. Navigate to: http://localhost:3000/teams/invalid-uuid-here
  2. Wait for: Error state to appear
  3. Assert: Error message or "not found" text is visible
  4. Screenshot: .sisyphus/evidence/task-3-team-404.png
  ```

  **Commit**: YES
  - Message: `feat(teams): add public team detail page with matches and stats`
  - Files: 
    - `apps/api/src/modules/teams/teams.controller.ts`
    - `apps/api/src/modules/teams/teams.service.ts`
    - `apps/web/src/services/teams.service.ts`
    - `apps/web/src/app/teams/[id]/page.tsx`
  - Pre-commit: `cd apps/web && npx tsc --noEmit`

---

- [ ] 4. Final verification with Playwright

  **What to do**:
  - Run full verification flow using Playwright
  - Navigate to team page with real team ID
  - Verify all 4 sections render correctly
  - Test 404 case
  - Capture screenshots as evidence

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Just running verification, no coding
  - **Skills**: [`playwright`]
    - `playwright`: Browser automation for verification

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 3

  **References**:
  - Evidence folder: `.sisyphus/evidence/`

  **Acceptance Criteria**:
  - [ ] Screenshot of successful team detail page saved
  - [ ] Screenshot of 404 page saved
  - [ ] All assertions passed
  - [ ] Report verification results

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 3 | `feat(teams): add public team detail page with matches and stats` | teams.controller.ts, teams.service.ts (API), teams.service.ts (web), [id]/page.tsx | TypeScript compile |

---

## Success Criteria

### Verification Commands
```bash
# Backend API check
curl -sS http://localhost:3001/teams/3dcc4ac9-e486-4757-8d21-c482406ffbb0 | jq '.name'
# Expected: Team name string

curl -sS "http://localhost:3001/teams/3dcc4ac9-e486-4757-8d21-c482406ffbb0/matches?type=upcoming&limit=5" | jq '.data | length'
# Expected: Number (0-5)

# TypeScript check
cd apps/web && npx tsc --noEmit
# Expected: No errors
```

### Final Checklist
- [ ] All "Must Have" present:
  - [ ] Team header with logo, name, country, sport
  - [ ] Upcoming matches section
  - [ ] Match history section  
  - [ ] Stats section (W/D/L, goals)
  - [ ] Loading skeleton
  - [ ] Error handling
  - [ ] Empty states
- [ ] All "Must NOT Have" absent:
  - [ ] No admin CRUD features
  - [ ] No player roster
  - [ ] No advanced stats
  - [ ] No betting odds
- [ ] TypeScript compiles without errors
- [ ] Page accessible at /teams/[id]
