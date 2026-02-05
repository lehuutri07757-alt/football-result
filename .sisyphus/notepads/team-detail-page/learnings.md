# Team Detail Page - Learnings & Conventions

## Established Patterns

### Backend (NestJS)
- Controller endpoints use `@Get()`, `@Param()`, `@Query()` decorators
- Service methods return Prisma queries with `include` for relations
- NotFoundException for missing resources
- Swagger decorators: `@ApiOperation()`, `@ApiResponse()`

### Frontend (Next.js)
- Detail pages are client components with 'use client'
- useParams from next/navigation for route params
- useState/useEffect for data fetching
- Service pattern: api.get with TypeScript interfaces
- Loading skeletons with @/components/ui/skeleton
- Error states with retry buttons

### UI Components
- Card, CardContent from @/components/ui/card
- Button from @/components/ui/button
- Icons from lucide-react
- Tailwind classes for styling

## Decisions Made

### Stats Computation
- Wins/Draws/Losses computed from finished matches only
- Goals For/Against based on team being home or away
- No advanced stats (xG, possession, etc.)

### Match Limits
- Upcoming: max 5 matches
- History: max 10 matches
- No pagination for MVP

### Language
- Vietnamese labels for UI sections
- Follow existing app patterns

## Gotchas & Edge Cases

- Team may not have logoUrl - use first letter fallback
- Inactive teams still viewable (not 404)
- Empty match lists need explicit empty states
- Match status enum: 'scheduled', 'live', 'finished', 'cancelled', 'postponed'
- Frontend services follow api.get<T>() pattern; new teams service mirrors match service style
- teams.service exposes Team/TeamMatch interfaces plus getById and getMatches (type filter, optional limit)
Appended note: Added QueryTeamMatchesDto (with MatchListType enum and limit default) mirroring QueryTeamDto structure for upcoming/finished matches filtering.

- Added TeamsService.findTeamMatches for filtered match listings with upcoming/finished ordering and relation includes.

## Recent Backend Update

- Added public `GET /teams/:id/matches` endpoint documented via Swagger and wired to `teamsService.findTeamMatches` with `QueryTeamMatchesDto` parameters.
