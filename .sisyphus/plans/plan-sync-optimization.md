# Plan: API Football Sync Optimization

## Context & Problem

Hệ thống hiện tại có rate limit: **300 requests/phút** và **7,500 requests/ngày**.

### Estimated Current Usage (Worst Case):
| Job | Frequency | Requests/run | Daily Total |
|-----|-----------|--------------|-------------|
| Live Odds | 5 min | 31 (1 + 30 matches) | **8,928** |
| Upcoming Odds | 30 min | 51 (1 + 50 matches) | **2,448** |
| Fixture Sync | 1 hour | 3 | **72** |
| League Sync | Daily | 1 | **1** |
| Team Sync | Daily | ~20 | **20** |
| **TOTAL** | | | **~11,469** |

**Problem**: Exceeds 7,500/day quota!

### Target After Optimization:
~1,845 requests/day (25% of quota)

---

## Implementation Tasks

### Task 1: Add Sync Config Interface & Defaults
**File**: `apps/api/src/modules/api-football/constants/api-football.constants.ts`

Add after `CACHE_KEYS`:

```typescript
// ============================================================
// SYNC CONFIGURATION - Configurable via Settings
// ============================================================

export const SETTING_KEYS = {
  SYNC_CONFIG: 'api_football.sync_config',
  LEAGUE_SYNC_CONFIG: 'league_sync_config', // backward compatible
} as const;

/**
 * Sync configuration interface for all API-Football sync jobs
 * All intervals are in MINUTES
 */
export interface ApiFootballSyncConfig {
  // Fixture sync settings
  fixture: {
    intervalMinutes: number;      // How often to sync fixtures (default: 120)
    pastDays: number;             // Days in the past to sync (default: 1)
    futureDays: number;           // Days in the future to sync (default: 1)
    enabled: boolean;
  };

  // Live odds sync settings
  liveOdds: {
    intervalMinutes: number;      // How often to sync live odds (default: 15)
    maxMatchesPerSync: number;    // Max live matches to sync at once (default: 15)
    enabled: boolean;
  };

  // Upcoming/pre-match odds sync settings
  upcomingOdds: {
    intervalMinutes: number;      // How often to sync upcoming odds (default: 120)
    hoursAhead: number;           // Hours ahead to look for matches (default: 48)
    maxMatchesPerSync: number;    // Max matches to sync at once (default: 20)
    enabled: boolean;
  };

  // League sync settings
  league: {
    intervalMinutes: number;      // Auto sync interval (default: 1440 = once per day)
    enabled: boolean;
  };

  // Team sync settings  
  team: {
    intervalMinutes: number;      // Auto sync interval (default: 1440 = once per day)
    enabled: boolean;
  };

  // Rate limiting
  rateLimit: {
    requestsPerMinute: number;    // Max requests per minute (default: 300)
    dailyLimit: number;           // Daily quota (default: 7500)
    delayBetweenRequests: number; // Delay in ms between sequential requests (default: 200)
  };
}

/**
 * Default sync configuration - optimized for 7500 requests/day quota
 * Estimated daily usage: ~1,845 requests (25% of quota)
 */
export const DEFAULT_SYNC_CONFIG: ApiFootballSyncConfig = {
  fixture: {
    intervalMinutes: 120,         // Every 2 hours (was 60)
    pastDays: 1,
    futureDays: 1,
    enabled: true,
  },
  liveOdds: {
    intervalMinutes: 15,          // Every 15 minutes (was 5)
    maxMatchesPerSync: 15,        // Max 15 matches (was 30)
    enabled: true,
  },
  upcomingOdds: {
    intervalMinutes: 120,         // Every 2 hours (was 30 min)
    hoursAhead: 48,
    maxMatchesPerSync: 20,        // Max 20 matches (was 50)
    enabled: true,
  },
  league: {
    intervalMinutes: 1440,        // Once per day
    enabled: true,
  },
  team: {
    intervalMinutes: 1440,        // Once per day
    enabled: true,
  },
  rateLimit: {
    requestsPerMinute: 300,
    dailyLimit: 7500,
    delayBetweenRequests: 200,    // 200ms delay = max 300/min
  },
};
```

---

### Task 2: Create SyncConfigService
**File**: `apps/api/src/modules/api-football/sync-config.service.ts` (NEW)

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { 
  ApiFootballSyncConfig, 
  DEFAULT_SYNC_CONFIG, 
  SETTING_KEYS 
} from './constants/api-football.constants';

@Injectable()
export class SyncConfigService implements OnModuleInit {
  private readonly logger = new Logger(SyncConfigService.name);
  private config: ApiFootballSyncConfig = DEFAULT_SYNC_CONFIG;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: SETTING_KEYS.SYNC_CONFIG },
      });

      if (setting?.value && typeof setting.value === 'object') {
        this.config = this.mergeConfig(setting.value as Partial<ApiFootballSyncConfig>);
        this.logger.log('Sync config loaded from database');
      } else {
        this.logger.log('Using default sync config');
      }

      this.logConfig();
    } catch (error) {
      this.logger.warn(`Failed to load sync config: ${error}`);
    }
  }

  private mergeConfig(partial: Partial<ApiFootballSyncConfig>): ApiFootballSyncConfig {
    return {
      fixture: { ...DEFAULT_SYNC_CONFIG.fixture, ...partial.fixture },
      liveOdds: { ...DEFAULT_SYNC_CONFIG.liveOdds, ...partial.liveOdds },
      upcomingOdds: { ...DEFAULT_SYNC_CONFIG.upcomingOdds, ...partial.upcomingOdds },
      league: { ...DEFAULT_SYNC_CONFIG.league, ...partial.league },
      team: { ...DEFAULT_SYNC_CONFIG.team, ...partial.team },
      rateLimit: { ...DEFAULT_SYNC_CONFIG.rateLimit, ...partial.rateLimit },
    };
  }

  private logConfig(): void {
    this.logger.log(`Fixture: every ${this.config.fixture.intervalMinutes}min, enabled=${this.config.fixture.enabled}`);
    this.logger.log(`Live Odds: every ${this.config.liveOdds.intervalMinutes}min, max=${this.config.liveOdds.maxMatchesPerSync}, enabled=${this.config.liveOdds.enabled}`);
    this.logger.log(`Upcoming Odds: every ${this.config.upcomingOdds.intervalMinutes}min, max=${this.config.upcomingOdds.maxMatchesPerSync}, enabled=${this.config.upcomingOdds.enabled}`);
  }

  getConfig(): ApiFootballSyncConfig {
    return this.config;
  }

  async updateConfig(partial: Partial<ApiFootballSyncConfig>): Promise<ApiFootballSyncConfig> {
    this.config = this.mergeConfig(partial);

    await this.prisma.setting.upsert({
      where: { key: SETTING_KEYS.SYNC_CONFIG },
      create: {
        key: SETTING_KEYS.SYNC_CONFIG,
        value: this.config as object,
        category: 'api_football',
        description: 'API Football sync configuration',
        isPublic: false,
      },
      update: {
        value: this.config as object,
      },
    });

    this.logger.log('Sync config updated');
    this.logConfig();

    return this.config;
  }

  // Convenience getters
  get fixtureConfig() { return this.config.fixture; }
  get liveOddsConfig() { return this.config.liveOdds; }
  get upcomingOddsConfig() { return this.config.upcomingOdds; }
  get leagueConfig() { return this.config.league; }
  get teamConfig() { return this.config.team; }
  get rateLimitConfig() { return this.config.rateLimit; }
}
```

---

### Task 3: Update OddsSyncService
**File**: `apps/api/src/modules/api-football/odds-sync.service.ts`

Changes:
1. Inject `SyncConfigService`
2. Use config values instead of hardcoded numbers

```typescript
// Add import
import { SyncConfigService } from './sync-config.service';

// Update constructor
constructor(
  private readonly prisma: PrismaService,
  private readonly redis: RedisService,
  private readonly apiFootballService: ApiFootballService,
  private readonly syncConfig: SyncConfigService,  // ADD THIS
) {}

// Update syncOddsForUpcomingMatches method
async syncOddsForUpcomingMatches(hoursAhead?: number): Promise<OddsSyncResult> {
  const config = this.syncConfig.upcomingOddsConfig;
  
  if (!config.enabled) {
    this.logger.log('Upcoming odds sync is disabled');
    return { totalMatches: 0, totalOdds: 0, created: 0, updated: 0, errors: [], syncedAt: new Date().toISOString() };
  }

  const effectiveHoursAhead = hoursAhead ?? config.hoursAhead;
  // ... rest of method

  const matches = await this.prisma.match.findMany({
    where: {
      startTime: { gte: now, lte: futureDate },
      status: 'scheduled',
      bettingEnabled: true,
      externalId: { not: null },
    },
    take: config.maxMatchesPerSync,  // USE CONFIG instead of 50
  });
  // ...
}

// Update syncOddsForLiveMatches method  
async syncOddsForLiveMatches(): Promise<OddsSyncResult> {
  const config = this.syncConfig.liveOddsConfig;
  
  if (!config.enabled) {
    this.logger.log('Live odds sync is disabled');
    return { totalMatches: 0, totalOdds: 0, created: 0, updated: 0, errors: [], syncedAt: new Date().toISOString() };
  }

  const liveMatches = await this.prisma.match.findMany({
    where: {
      isLive: true,
      status: 'live',
      bettingEnabled: true,
      externalId: { not: null },
    },
    take: config.maxMatchesPerSync,  // USE CONFIG instead of 30
  });
  // ...
}
```

---

### Task 4: Update ApiFootballScheduler for Dynamic Intervals
**File**: `apps/api/src/modules/api-football/api-football.scheduler.ts`

Replace static cron with dynamic intervals:

```typescript
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SyncConfigService } from './sync-config.service';
// ... other imports

@Injectable()
export class ApiFootballScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApiFootballScheduler.name);

  private fixtureInterval: NodeJS.Timeout | null = null;
  private liveOddsInterval: NodeJS.Timeout | null = null;
  private upcomingOddsInterval: NodeJS.Timeout | null = null;
  private leagueInterval: NodeJS.Timeout | null = null;
  private teamInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly leagueSyncService: LeagueSyncService,
    private readonly teamSyncService: TeamSyncService,
    private readonly fixtureSyncService: FixtureSyncService,
    private readonly oddsSyncService: OddsSyncService,
    private readonly syncConfig: SyncConfigService,  // ADD
  ) {}

  async onModuleInit() {
    // Wait a bit for config to load
    setTimeout(() => this.setupSchedulers(), 5000);
  }

  onModuleDestroy() {
    this.clearAllIntervals();
  }

  private setupSchedulers(): void {
    this.clearAllIntervals();
    const config = this.syncConfig.getConfig();

    // Fixture sync
    if (config.fixture.enabled) {
      const ms = config.fixture.intervalMinutes * 60 * 1000;
      this.fixtureInterval = setInterval(() => this.handleFixtureSync(), ms);
      this.logger.log(`Fixture sync scheduled every ${config.fixture.intervalMinutes} minutes`);
    }

    // Live odds sync
    if (config.liveOdds.enabled) {
      const ms = config.liveOdds.intervalMinutes * 60 * 1000;
      this.liveOddsInterval = setInterval(() => this.handleLiveOddsSync(), ms);
      this.logger.log(`Live odds sync scheduled every ${config.liveOdds.intervalMinutes} minutes`);
    }

    // Upcoming odds sync
    if (config.upcomingOdds.enabled) {
      const ms = config.upcomingOdds.intervalMinutes * 60 * 1000;
      this.upcomingOddsInterval = setInterval(() => this.handleUpcomingOddsSync(), ms);
      this.logger.log(`Upcoming odds sync scheduled every ${config.upcomingOdds.intervalMinutes} minutes`);
    }

    // League sync (daily at 3AM still makes sense, but can also use interval)
    if (config.league.enabled) {
      const ms = config.league.intervalMinutes * 60 * 1000;
      this.leagueInterval = setInterval(() => this.handleLeagueSync(), ms);
      this.logger.log(`League sync scheduled every ${config.league.intervalMinutes} minutes`);
    }

    // Team sync
    if (config.team.enabled) {
      const ms = config.team.intervalMinutes * 60 * 1000;
      this.teamInterval = setInterval(() => this.handleTeamSync(), ms);
      this.logger.log(`Team sync scheduled every ${config.team.intervalMinutes} minutes`);
    }
  }

  private clearAllIntervals(): void {
    [this.fixtureInterval, this.liveOddsInterval, this.upcomingOddsInterval, 
     this.leagueInterval, this.teamInterval].forEach(interval => {
      if (interval) clearInterval(interval);
    });
    this.fixtureInterval = null;
    this.liveOddsInterval = null;
    this.upcomingOddsInterval = null;
    this.leagueInterval = null;
    this.teamInterval = null;
  }

  // Existing handler methods stay the same
  async handleLeagueSync() { /* ... */ }
  async handleTeamSync() { /* ... */ }
  async handleFixtureSync() { /* ... */ }
  async handleUpcomingOddsSync() { /* ... */ }
  async handleLiveOddsSync() { /* ... */ }

  // NEW: Reload schedulers when config changes
  async reloadSchedulers(): Promise<void> {
    await this.syncConfig.loadConfig();
    this.setupSchedulers();
    this.logger.log('Schedulers reloaded with new config');
  }
}
```

---

### Task 5: Add API Endpoints for Config Management
**File**: `apps/api/src/modules/api-football/api-football.controller.ts`

Add endpoints:

```typescript
// Add import
import { SyncConfigService } from './sync-config.service';
import { ApiFootballSyncConfig } from './constants/api-football.constants';

// Add to constructor
constructor(
  // ... existing
  private readonly syncConfigService: SyncConfigService,
) {}

// Add new endpoints
@Get('sync/config')
@ApiOperation({ summary: 'Get sync configuration' })
async getSyncConfig() {
  return this.syncConfigService.getConfig();
}

@Put('sync/config')
@ApiOperation({ summary: 'Update sync configuration' })
async updateSyncConfig(@Body() config: Partial<ApiFootballSyncConfig>) {
  return this.syncConfigService.updateConfig(config);
}

@Post('sync/reload-schedulers')
@ApiOperation({ summary: 'Reload schedulers with current config' })
async reloadSchedulers() {
  await this.scheduler.reloadSchedulers();
  return { message: 'Schedulers reloaded' };
}
```

---

### Task 6: Update Module
**File**: `apps/api/src/modules/api-football/api-football.module.ts`

Add `SyncConfigService` to providers and exports:

```typescript
import { SyncConfigService } from './sync-config.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, RedisModule],
  controllers: [ApiFootballController],
  providers: [
    ApiFootballService,
    LeagueSyncService,
    TeamSyncService,
    FixtureSyncService,
    OddsSyncService,
    SyncConfigService,      // ADD
    ApiFootballScheduler,
  ],
  exports: [
    ApiFootballService, 
    LeagueSyncService, 
    FixtureSyncService, 
    OddsSyncService,
    SyncConfigService,      // ADD
  ],
})
export class ApiFootballModule {}
```

---

### Task 7: Seed Default Config (Optional)
**File**: `apps/api/prisma/seed.ts`

Add to seeding:

```typescript
// Seed default sync config
await prisma.setting.upsert({
  where: { key: 'api_football.sync_config' },
  update: {},
  create: {
    key: 'api_football.sync_config',
    value: {
      fixture: { intervalMinutes: 120, pastDays: 1, futureDays: 1, enabled: true },
      liveOdds: { intervalMinutes: 15, maxMatchesPerSync: 15, enabled: true },
      upcomingOdds: { intervalMinutes: 120, hoursAhead: 48, maxMatchesPerSync: 20, enabled: true },
      league: { intervalMinutes: 1440, enabled: true },
      team: { intervalMinutes: 1440, enabled: true },
      rateLimit: { requestsPerMinute: 300, dailyLimit: 7500, delayBetweenRequests: 200 },
    },
    category: 'api_football',
    description: 'API Football sync configuration - controls frequency and limits',
    isPublic: false,
  },
});
```

---

## Verification

After implementation, verify:

1. **Config loads correctly**: Check logs on startup
2. **Intervals are dynamic**: Change config via API, call reload
3. **Limits work**: Check that `take: X` uses config values
4. **Enable/disable works**: Set `enabled: false` and verify job skips

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Daily API calls | ~11,469 | ~1,845 |
| Quota usage | 153% (OVER!) | 25% |
| Live odds freshness | 5 min | 15 min |
| Upcoming odds freshness | 30 min | 2 hours |

---

## Quick Adjust via API

After deployment, you can adjust via API:

```bash
# Get current config
curl -X GET http://localhost:3000/api-football/sync/config

# Update live odds to sync every 10 minutes with max 20 matches
curl -X PUT http://localhost:3000/api-football/sync/config \
  -H "Content-Type: application/json" \
  -d '{"liveOdds": {"intervalMinutes": 10, "maxMatchesPerSync": 20}}'

# Reload schedulers
curl -X POST http://localhost:3000/api-football/sync/reload-schedulers
```
