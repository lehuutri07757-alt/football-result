"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LeagueSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeagueSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const api_football_service_1 = require("./api-football.service");
const CACHE_KEY_LEAGUES = 'api_football:leagues';
const CACHE_KEY_TOP_LEAGUES = 'api_football:top_leagues';
const SETTING_KEY_SYNC_CONFIG = 'league_sync_config';
const DEFAULT_CONFIG = {
    cacheTtlSeconds: 3600,
    syncIntervalMinutes: 60,
    enableAutoSync: true,
    onlyCurrentSeason: true,
};
let LeagueSyncService = LeagueSyncService_1 = class LeagueSyncService {
    constructor(prisma, redis, apiFootballService) {
        this.prisma = prisma;
        this.redis = redis;
        this.apiFootballService = apiFootballService;
        this.logger = new common_1.Logger(LeagueSyncService_1.name);
        this.config = DEFAULT_CONFIG;
        this.syncInterval = null;
    }
    async onModuleInit() {
        await this.loadConfig();
        this.setupAutoSync();
    }
    onModuleDestroy() {
        this.clearAutoSync();
    }
    async loadConfig() {
        try {
            const setting = await this.prisma.setting.findUnique({
                where: { key: SETTING_KEY_SYNC_CONFIG },
            });
            if (setting?.value && typeof setting.value === 'object' && !Array.isArray(setting.value)) {
                this.config = { ...DEFAULT_CONFIG, ...setting.value };
            }
            this.logger.log(`League sync config loaded: TTL=${this.config.cacheTtlSeconds}s, Interval=${this.config.syncIntervalMinutes}min`);
        }
        catch (error) {
            this.logger.warn(`Failed to load sync config, using defaults: ${error}`);
        }
    }
    setupAutoSync() {
        this.clearAutoSync();
        if (!this.config.enableAutoSync) {
            this.logger.log('Auto sync is disabled');
            return;
        }
        const intervalMs = this.config.syncIntervalMinutes * 60 * 1000;
        this.syncInterval = setInterval(() => {
            void this.syncLeagues();
        }, intervalMs);
        this.logger.log(`Auto sync scheduled every ${this.config.syncIntervalMinutes} minutes`);
    }
    clearAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    async getConfig() {
        return this.config;
    }
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        await this.prisma.setting.upsert({
            where: { key: SETTING_KEY_SYNC_CONFIG },
            create: {
                key: SETTING_KEY_SYNC_CONFIG,
                value: this.config,
                category: 'api_football',
                description: 'League sync configuration',
                isPublic: false,
            },
            update: {
                value: this.config,
            },
        });
        this.setupAutoSync();
        this.logger.log(`Config updated: TTL=${this.config.cacheTtlSeconds}s, Interval=${this.config.syncIntervalMinutes}min`);
        return this.config;
    }
    async getCachedLeagues() {
        return this.redis.getJson(CACHE_KEY_LEAGUES);
    }
    async getLeagues(forceRefresh = false) {
        if (!forceRefresh) {
            const cached = await this.getCachedLeagues();
            if (cached) {
                this.logger.debug('Returning cached leagues');
                return cached;
            }
        }
        const leagues = await this.fetchLeaguesFromApi();
        await this.redis.setJson(CACHE_KEY_LEAGUES, leagues, this.config.cacheTtlSeconds);
        return leagues;
    }
    async syncLeagues() {
        const result = {
            totalFetched: 0,
            created: 0,
            updated: 0,
            errors: [],
            syncedAt: new Date().toISOString(),
        };
        try {
            this.logger.log('Starting league sync...');
            const apiLeagues = await this.fetchLeaguesFromApi();
            result.totalFetched = apiLeagues.length;
            const footballSport = await this.getOrCreateFootballSport();
            for (const apiLeague of apiLeagues) {
                try {
                    const existing = await this.prisma.league.findFirst({
                        where: { externalId: apiLeague.league.id.toString() },
                    });
                    const currentSeason = apiLeague.seasons.find(s => s.current);
                    const leagueData = {
                        name: apiLeague.league.name,
                        slug: this.generateSlug(apiLeague.league.name, apiLeague.country.name),
                        country: apiLeague.country.name,
                        countryCode: apiLeague.country.code,
                        logoUrl: apiLeague.league.logo,
                        season: currentSeason?.year?.toString(),
                        sportId: footballSport.id,
                        externalId: apiLeague.league.id.toString(),
                        isActive: true,
                    };
                    if (existing) {
                        await this.prisma.league.update({
                            where: { id: existing.id },
                            data: leagueData,
                        });
                        result.updated++;
                    }
                    else {
                        await this.prisma.league.create({
                            data: leagueData,
                        });
                        result.created++;
                    }
                }
                catch (error) {
                    const msg = `Failed to sync league ${apiLeague.league.name}: ${error}`;
                    this.logger.warn(msg);
                    result.errors.push(msg);
                }
            }
            await this.redis.setJson(CACHE_KEY_LEAGUES, apiLeagues, this.config.cacheTtlSeconds);
            await this.invalidateTopLeaguesCache();
            this.logger.log(`League sync complete: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`);
        }
        catch (error) {
            const msg = `League sync failed: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
        }
        return result;
    }
    async invalidateCache() {
        const client = this.redis.getClient();
        await client.del(CACHE_KEY_LEAGUES);
        await client.del(CACHE_KEY_TOP_LEAGUES);
        this.logger.log('League cache invalidated');
    }
    async invalidateTopLeaguesCache() {
        const client = this.redis.getClient();
        const keys = await client.keys(`${CACHE_KEY_TOP_LEAGUES}:*`);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    }
    async fetchLeaguesFromApi() {
        return this.apiFootballService.fetchAllLeagues(this.config.onlyCurrentSeason);
    }
    async getOrCreateFootballSport() {
        let sport = await this.prisma.sport.findFirst({
            where: { slug: 'football' },
        });
        if (!sport) {
            sport = await this.prisma.sport.create({
                data: {
                    name: 'Football',
                    slug: 'football',
                    icon: 'football',
                    isActive: true,
                    sortOrder: 1,
                },
            });
        }
        return sport;
    }
    generateSlug(name, country) {
        const base = `${country || ''}-${name}`.toLowerCase();
        return base
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    async triggerManualSync() {
        return this.syncLeagues();
    }
    getSyncStatus() {
        const nextRun = this.syncInterval
            ? new Date(Date.now() + this.config.syncIntervalMinutes * 60 * 1000)
            : null;
        return {
            nextRun,
            isEnabled: this.config.enableAutoSync,
            intervalMinutes: this.config.syncIntervalMinutes,
        };
    }
};
exports.LeagueSyncService = LeagueSyncService;
exports.LeagueSyncService = LeagueSyncService = LeagueSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        api_football_service_1.ApiFootballService])
], LeagueSyncService);
//# sourceMappingURL=league-sync.service.js.map