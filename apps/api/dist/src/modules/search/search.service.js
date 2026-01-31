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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const leagues_service_1 = require("../leagues/leagues.service");
const teams_service_1 = require("../teams/teams.service");
const matches_service_1 = require("../matches/matches.service");
let SearchService = class SearchService {
    constructor(leaguesService, teamsService, matchesService) {
        this.leaguesService = leaguesService;
        this.teamsService = teamsService;
        this.matchesService = matchesService;
    }
    async globalSearch(query, limit = 5) {
        const startTime = Date.now();
        if (!query || query.trim().length < 2) {
            throw new common_1.BadRequestException('Search query must be at least 2 characters long');
        }
        const searchQuery = query.trim();
        const searchLimit = this.clampLimit(limit);
        try {
            const [leaguesResult, teamsResult, matchesResult] = await Promise.all([
                this.searchActiveLeagues(searchQuery, searchLimit),
                this.searchActiveTeams(searchQuery, searchLimit),
                this.searchUpcomingMatches(searchQuery, searchLimit),
            ]);
            const executionTime = Date.now() - startTime;
            return {
                leagues: leaguesResult.data || [],
                teams: teamsResult.data || [],
                matches: matchesResult.data || [],
                meta: {
                    total: (leaguesResult.meta?.total || 0) +
                        (teamsResult.meta?.total || 0) +
                        (matchesResult.meta?.total || 0),
                    query: searchQuery,
                    limit: searchLimit,
                    executionTime,
                    counts: {
                        leagues: leaguesResult.meta?.total || 0,
                        teams: teamsResult.meta?.total || 0,
                        matches: matchesResult.meta?.total || 0,
                    },
                },
            };
        }
        catch (error) {
            console.error('Global search error:', error);
            throw error;
        }
    }
    clampLimit(limit) {
        return Math.min(Math.max(1, limit), 20);
    }
    async searchActiveLeagues(query, limit) {
        return this.leaguesService
            .findAll({ search: query, limit, page: 1, isActive: true })
            .catch(() => ({ data: [], meta: { total: 0 } }));
    }
    async searchActiveTeams(query, limit) {
        return this.teamsService
            .findAll({ search: query, limit, page: 1, isActive: true })
            .catch(() => ({ data: [], meta: { total: 0 } }));
    }
    async searchUpcomingMatches(query, limit) {
        return this.matchesService
            .findAll({
            search: query,
            limit,
            page: 1,
            dateFrom: new Date().toISOString(),
        })
            .catch(() => ({ data: [], meta: { total: 0 } }));
    }
    async getSuggestions(query) {
        if (!query || query.trim().length < 1) {
            return { suggestions: [] };
        }
        const searchQuery = query.trim();
        const [leagues, teams] = await Promise.all([
            this.leaguesService.findAll({
                search: searchQuery,
                limit: 3,
                page: 1,
                isActive: true,
            }).catch(() => ({ data: [] })),
            this.teamsService.findAll({
                search: searchQuery,
                limit: 3,
                page: 1,
                isActive: true,
            }).catch(() => ({ data: [] })),
        ]);
        const suggestions = [
            ...(leagues.data || []).map(l => ({
                type: 'league',
                value: l.name,
                id: l.id,
            })),
            ...(teams.data || []).map(t => ({
                type: 'team',
                value: t.name,
                id: t.id,
            })),
        ].slice(0, 5);
        return {
            suggestions,
            query: searchQuery,
        };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [leagues_service_1.LeaguesService,
        teams_service_1.TeamsService,
        matches_service_1.MatchesService])
], SearchService);
//# sourceMappingURL=search.service.js.map