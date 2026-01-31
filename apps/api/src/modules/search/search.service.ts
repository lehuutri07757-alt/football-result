import { Injectable, BadRequestException } from '@nestjs/common';
import { LeaguesService } from '../leagues/leagues.service';
import { TeamsService } from '../teams/teams.service';
import { MatchesService } from '../matches/matches.service';

@Injectable()
export class SearchService {
  constructor(
    private leaguesService: LeaguesService,
    private teamsService: TeamsService,
    private matchesService: MatchesService,
  ) {}

  async globalSearch(query: string, limit: number = 5) {
    const startTime = Date.now();

    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
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
          total: 
            (leaguesResult.meta?.total || 0) +
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
    } catch (error) {
      console.error('Global search error:', error);
      throw error;
    }
  }

  private clampLimit(limit: number): number {
    return Math.min(Math.max(1, limit), 20);
  }

  private async searchActiveLeagues(query: string, limit: number) {
    return this.leaguesService
      .findAll({ search: query, limit, page: 1, isActive: true })
      .catch(() => ({ data: [], meta: { total: 0 } }));
  }

  private async searchActiveTeams(query: string, limit: number) {
    return this.teamsService
      .findAll({ search: query, limit, page: 1, isActive: true })
      .catch(() => ({ data: [], meta: { total: 0 } }));
  }

  private async searchUpcomingMatches(query: string, limit: number) {
    return this.matchesService
      .findAll({
        search: query,
        limit,
        page: 1,
        dateFrom: new Date().toISOString(),
      })
      .catch(() => ({ data: [], meta: { total: 0 } }));
  }

  async getSuggestions(query: string) {
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
        type: 'league' as const,
        value: l.name,
        id: l.id,
      })),
      ...(teams.data || []).map(t => ({
        type: 'team' as const,
        value: t.name,
        id: t.id,
      })),
    ].slice(0, 5);

    return {
      suggestions,
      query: searchQuery,
    };
  }
}
