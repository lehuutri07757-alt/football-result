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
const PARALLEL_LEAGUE_BATCH_SIZE = 5;
let TeamSyncService = TeamSyncService_1 = class TeamSyncService {
    constructor(prisma, redis, apiFootballService) {
        this.prisma = prisma;
        this.redis = redis;
        this.apiFootballService = apiFootballService;
        this.logger = new common_1.Logger(TeamSyncService_1.name);
    }
    async syncAllActiveLeagues(onProgress) {
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
            const totalLeagues = activeLeagues.length;
            let processedLeagues = 0;
            for (let i = 0; i < activeLeagues.length; i += PARALLEL_LEAGUE_BATCH_SIZE) {
                const batch = activeLeagues.slice(i, i + PARALLEL_LEAGUE_BATCH_SIZE);
                const batchNumber = Math.floor(i / PARALLEL_LEAGUE_BATCH_SIZE) + 1;
                const totalBatches = Math.ceil(activeLeagues.length / PARALLEL_LEAGUE_BATCH_SIZE);
                this.logger.log(`Processing league batch ${batchNumber}/${totalBatches} (${batch.length} leagues)`);
                const batchPromises = batch.map(async (league) => {
                    try {
                        return await this.syncTeamsByLeague(league.externalId, league.season || undefined);
                    }
                    catch (error) {
                        const msg = `Failed to sync teams for league ${league.name}: ${error}`;
                        this.logger.error(msg);
                        return {
                            totalFetched: 0,
                            created: 0,
                            updated: 0,
                            skipped: 0,
                            errors: [msg],
                            syncedAt: new Date().toISOString(),
                        };
                    }
                });
                const batchResults = await Promise.all(batchPromises);
                for (const leagueResult of batchResults) {
                    result.totalFetched += leagueResult.totalFetched;
                    result.created += leagueResult.created;
                    result.updated += leagueResult.updated;
                    result.skipped += leagueResult.skipped;
                    result.errors.push(...leagueResult.errors);
                }
                processedLeagues += batch.length;
                const progress = Math.round((processedLeagues / totalLeagues) * 100);
                if (onProgress) {
                    await onProgress(progress, processedLeagues, totalLeagues);
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
            const parsedSeason = season ? parseInt(season, 10) : undefined;
            const effectiveSeason = parsedSeason && !isNaN(parsedSeason) ? parsedSeason : undefined;
            this.logger.log(`Fetching teams for league ${leagueExternalId}, season ${effectiveSeason || 'current'}...`);
            const apiTeams = await this.apiFootballService.fetchTeams(parseInt(leagueExternalId, 10), effectiveSeason);
            result.totalFetched = apiTeams.length;
            this.logger.log(`Fetched ${apiTeams.length} teams from API for league ${leagueExternalId}`);
            if (apiTeams.length === 0) {
                return result;
            }
            const footballSport = await this.getOrCreateFootballSport();
            const validTeams = apiTeams.filter(t => t.team?.id);
            const externalIds = validTeams.map(t => t.team.id.toString());
            const existingTeams = await this.prisma.team.findMany({
                where: {
                    externalId: { in: externalIds },
                    sportId: footballSport.id,
                },
                select: { id: true, externalId: true },
            });
            const existingMap = new Map(existingTeams.map(t => [t.externalId, t.id]));
            const teamsToCreate = [];
            const teamsToUpdate = [];
            for (const apiTeam of validTeams) {
                if (!apiTeam.team?.id) {
                    result.skipped++;
                    continue;
                }
                const externalId = apiTeam.team.id.toString();
                const existingId = existingMap.get(externalId);
                const teamData = {
                    name: apiTeam.team.name,
                    shortName: apiTeam.team.code || apiTeam.team.name.substring(0, 3).toUpperCase(),
                    slug: this.generateSlug(apiTeam.team.name),
                    logoUrl: apiTeam.team.logo,
                    country: apiTeam.team.country,
                    countryCode: apiTeam.team.code || null,
                    isActive: true,
                };
                if (existingId) {
                    teamsToUpdate.push({ id: existingId, data: teamData });
                }
                else {
                    teamsToCreate.push({
                        ...teamData,
                        sportId: footballSport.id,
                        externalId,
                    });
                }
            }
            if (teamsToCreate.length > 0) {
                await this.prisma.team.createMany({
                    data: teamsToCreate,
                    skipDuplicates: true,
                });
                result.created = teamsToCreate.length;
            }
            if (teamsToUpdate.length > 0) {
                const UPDATE_BATCH_SIZE = 50;
                for (let i = 0; i < teamsToUpdate.length; i += UPDATE_BATCH_SIZE) {
                    const updateBatch = teamsToUpdate.slice(i, i + UPDATE_BATCH_SIZE);
                    await this.prisma.$transaction(updateBatch.map(({ id, data }) => this.prisma.team.update({ where: { id }, data })));
                }
                result.updated = teamsToUpdate.length;
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