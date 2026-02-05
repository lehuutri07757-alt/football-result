# API-FOOTBALL MODULE

External data sync from API-Football.com. Bull queues + schedulers.

## STRUCTURE

```
api-football/
├── api-football.module.ts      # Bull queue registration
├── api-football.service.ts     # API client + data fetching
├── api-football.controller.ts  # Admin endpoints
├── api-football.scheduler.ts   # Cron jobs
├── sync-job.service.ts         # Job creation/management
├── sync-job.processor.ts       # Queue consumer
├── sync-job.controller.ts      # Job status endpoints
├── *-sync.service.ts           # Domain sync services (5)
├── sync-config.service.ts      # Sync settings
├── interfaces/                 # Types + queue name constant
├── dto/                        # Query DTOs
├── constants/                  # API constants
└── interceptors/               # Response transform
```

## SYNC SERVICES

| Service | Domain | External API |
|---------|--------|--------------|
| `LeagueSyncService` | Leagues | `/leagues` |
| `TeamSyncService` | Teams | `/teams` |
| `TeamStatisticsSyncService` | Team stats | `/teams/statistics` |
| `FixtureSyncService` | Matches | `/fixtures` |
| `OddsSyncService` | Odds | `/odds` |
| `StandingsSyncService` | Standings | `/standings` |

## QUEUE PATTERN

```typescript
// Queue name constant - interfaces/index.ts
export const SYNC_QUEUE_NAME = 'sync-jobs';

// Creating job
await this.syncJobQueue.add('sync-leagues', payload, {
  attempts: 3,
  removeOnComplete: 100,
});

// Processing - sync-job.processor.ts
@Process('sync-leagues')
async handleLeagueSync(job: Job<SyncJobPayload>) { ... }
```

## SCHEDULER PATTERN

```typescript
// api-football.scheduler.ts
@Cron('0 */15 * * * *')  // Every 15 min
async syncLiveMatches() { ... }

@Cron('0 0 3 * * *')     // Daily 3 AM
async syncAllLeagues() { ... }
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Add new sync job type | `interfaces/sync-job.interface.ts` + `sync-job.processor.ts` |
| Change sync intervals | `api-football.scheduler.ts` |
| Modify API response mapping | `*-sync.service.ts` (relevant domain) |
| Add admin sync endpoint | `api-football.controller.ts` |
| Queue settings | `api-football.module.ts` (BullModule config) |

## ANTI-PATTERNS

- Don't call external API directly from controller - use sync services
- Don't skip job retries for transient failures
- Don't process heavy sync in scheduler - queue it instead
- Don't forget `lockDuration` for long-running jobs

## NOTES

- API key in `API_FOOTBALL_KEY` env var
- Rate limits: configurable via `SyncConfigService`
- Queue requires Redis running
- Job locks: 5 min default, renew every 2.5 min
