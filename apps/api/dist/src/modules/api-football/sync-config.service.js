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
var SyncConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const api_football_constants_1 = require("./constants/api-football.constants");
let SyncConfigService = SyncConfigService_1 = class SyncConfigService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SyncConfigService_1.name);
        this.config = api_football_constants_1.DEFAULT_SYNC_CONFIG;
    }
    async onModuleInit() {
        await this.loadConfig();
    }
    async loadConfig() {
        try {
            const setting = await this.prisma.setting.findUnique({
                where: { key: api_football_constants_1.SETTING_KEYS.SYNC_CONFIG },
            });
            if (setting?.value && typeof setting.value === 'object') {
                this.config = this.mergeConfig(setting.value);
                this.logger.log('Sync config loaded from database');
            }
            else {
                this.logger.log('Using default sync config');
            }
            this.logConfig();
        }
        catch (error) {
            this.logger.warn(`Failed to load sync config: ${error}`);
        }
    }
    mergeConfig(partial) {
        return {
            fixture: { ...api_football_constants_1.DEFAULT_SYNC_CONFIG.fixture, ...partial.fixture },
            liveOdds: { ...api_football_constants_1.DEFAULT_SYNC_CONFIG.liveOdds, ...partial.liveOdds },
            upcomingOdds: { ...api_football_constants_1.DEFAULT_SYNC_CONFIG.upcomingOdds, ...partial.upcomingOdds },
            league: { ...api_football_constants_1.DEFAULT_SYNC_CONFIG.league, ...partial.league },
            team: { ...api_football_constants_1.DEFAULT_SYNC_CONFIG.team, ...partial.team },
            rateLimit: { ...api_football_constants_1.DEFAULT_SYNC_CONFIG.rateLimit, ...partial.rateLimit },
        };
    }
    logConfig() {
        this.logger.log(`Fixture: every ${this.config.fixture.intervalMinutes}min, enabled=${this.config.fixture.enabled}`);
        this.logger.log(`Live Odds: every ${this.config.liveOdds.intervalMinutes}min, max=${this.config.liveOdds.maxMatchesPerSync}, enabled=${this.config.liveOdds.enabled}`);
        this.logger.log(`Upcoming Odds: every ${this.config.upcomingOdds.intervalMinutes}min, max=${this.config.upcomingOdds.maxMatchesPerSync}, enabled=${this.config.upcomingOdds.enabled}`);
    }
    getConfig() {
        return this.config;
    }
    async updateConfig(partial) {
        this.config = this.mergeConfig(partial);
        await this.prisma.setting.upsert({
            where: { key: api_football_constants_1.SETTING_KEYS.SYNC_CONFIG },
            create: {
                key: api_football_constants_1.SETTING_KEYS.SYNC_CONFIG,
                value: this.config,
                category: 'api_football',
                description: 'API Football sync configuration',
                isPublic: false,
            },
            update: {
                value: this.config,
            },
        });
        this.logger.log('Sync config updated');
        this.logConfig();
        return this.config;
    }
    get fixtureConfig() { return this.config.fixture; }
    get liveOddsConfig() { return this.config.liveOdds; }
    get upcomingOddsConfig() { return this.config.upcomingOdds; }
    get leagueConfig() { return this.config.league; }
    get teamConfig() { return this.config.team; }
    get rateLimitConfig() { return this.config.rateLimit; }
};
exports.SyncConfigService = SyncConfigService;
exports.SyncConfigService = SyncConfigService = SyncConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SyncConfigService);
//# sourceMappingURL=sync-config.service.js.map