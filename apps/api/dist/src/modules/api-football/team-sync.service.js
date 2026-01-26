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
var TeamSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const api_football_service_1 = require("./api-football.service");
const CACHE_KEY_TEAMS = 'api_football:teams';
let TeamSyncService = TeamSyncService_1 = class TeamSyncService {
    constructor(prisma, redis, apiFootballService) {
        this.prisma = prisma;
        this.redis = redis;
        this.apiFootballService = apiFootballService;
        this.logger = new common_1.Logger(TeamSyncService_1.name);
    }
    async syncAllActiveLeagues() {
        const result = {
            totalFetched: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: [],
            syncedAt: new Date().toISOString(),
        };
        try {
            this.logger.log('Starting team sync for all active leagues...');
            const activeLeagues = await this.prisma.league.findMany({
                where: { isActive: true },
                include: { sport: true },
            });
            this.logger.log(`Found ${activeLeagues.length} active leagues`);
            for (const league of activeLeagues) {
                try {
                    const leagueResult = await this.syncTeamsByLeague(league.externalId, league.season || undefined);
                    result.totalFetched += leagueResult.totalFetched;
                    result.created += leagueResult.created;
                    result.updated += leagueResult.updated;
                    result.skipped += leagueResult.skipped;
                    result.errors.push(...leagueResult.errors);
                }
                catch (error) {
                    const msg = `Failed to sync teams for league ${league.name}: ${error}`;
                    this.logger.error(msg);
                    result.errors.push(msg);
                }
            }
            this.logger.log(`Team sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`);
        }
        catch (error) {
            const msg = `Team sync failed: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
        }
        return result;
    }
    async syncTeamsByLeague(leagueExternalId, season) {
        const result = {
            totalFetched: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: [],
            syncedAt: new Date().toISOString(),
        };
        try {
            this.logger.log(`Fetching teams for league ${leagueExternalId}, season ${season || 'current'}...`);
            const apiTeams = await this.apiFootballService.fetchTeams(parseInt(leagueExternalId, 10), season ? parseInt(season, 10) : undefined);
            result.totalFetched = apiTeams.length;
            this.logger.log(`Fetched ${apiTeams.length} teams from API`);
            const footballSport = await this.getOrCreateFootballSport();
            for (const apiTeam of apiTeams) {
                try {
                    if (!apiTeam.team?.id) {
                        result.skipped++;
                        continue;
                    }
                    const existing = await this.prisma.team.findFirst({
                        where: {
                            externalId: apiTeam.team.id.toString(),
                            sportId: footballSport.id,
                        },
                    });
                    const teamData = {
                        name: apiTeam.team.name,
                        shortName: apiTeam.team.code || apiTeam.team.name.substring(0, 3).toUpperCase(),
                        slug: this.generateSlug(apiTeam.team.name),
                        logoUrl: apiTeam.team.logo,
                        country: apiTeam.team.country,
                        countryCode: apiTeam.team.code || null,
                        sportId: footballSport.id,
                        externalId: apiTeam.team.id.toString(),
                        isActive: true,
                    };
                    if (existing) {
                        await this.prisma.team.update({
                            where: { id: existing.id },
                            data: teamData,
                        });
                        result.updated++;
                    }
                    else {
                        await this.prisma.team.create({
                            data: teamData,
                        });
                        result.created++;
                    }
                }
                catch (error) {
                    const msg = `Failed to sync team ${apiTeam.team?.name}: ${error}`;
                    this.logger.warn(msg);
                    result.errors.push(msg);
                }
            }
            const cacheKey = `${CACHE_KEY_TEAMS}:${leagueExternalId}:${season || 'current'}`;
            await this.redis.setJson(cacheKey, apiTeams, 86400);
            this.logger.log(`League ${leagueExternalId} sync: ${result.created} created, ${result.updated} updated`);
        }
        catch (error) {
            const msg = `Failed to sync teams for league ${leagueExternalId}: ${error}`;
            this.logger.error(msg);
            result.errors.push(msg);
        }
        return result;
    }
    async getTeamsCount() {
        const total = await this.prisma.team.count();
        const byLeague = await this.prisma.team.groupBy({
            by: ['sportId'],
            _count: { id: true },
        });
        return {
            total,
            byLeague: byLeague.reduce((acc, item) => {
                acc[item.sportId] = item._count.id;
                return acc;
            }, {}),
        };
    }
    async invalidateCache() {
        const client = this.redis.getClient();
        const keys = await client.keys(`${CACHE_KEY_TEAMS}:*`);
        if (keys.length > 0) {
            await client.del(...keys);
        }
        this.logger.log('Teams cache invalidated');
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
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
};
exports.TeamSyncService = TeamSyncService;
exports.TeamSyncService = TeamSyncService = TeamSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        api_football_service_1.ApiFootballService])
], TeamSyncService);
//# sourceMappingURL=team-sync.service.js.map