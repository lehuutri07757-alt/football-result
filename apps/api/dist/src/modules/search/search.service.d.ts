import { LeaguesService } from '../leagues/leagues.service';
import { TeamsService } from '../teams/teams.service';
import { MatchesService } from '../matches/matches.service';
export declare class SearchService {
    private leaguesService;
    private teamsService;
    private matchesService;
    constructor(leaguesService: LeaguesService, teamsService: TeamsService, matchesService: MatchesService);
    globalSearch(query: string, limit?: number): Promise<{
        leagues: never[] | ({
            sport: {
                name: string;
                createdAt: Date;
                sortOrder: number;
                id: string;
                updatedAt: Date;
                slug: string;
                icon: string | null;
                isActive: boolean;
            };
            _count: {
                matches: number;
            };
        } & {
            name: string;
            createdAt: Date;
            sortOrder: number;
            id: string;
            updatedAt: Date;
            countryCode: string | null;
            slug: string;
            isActive: boolean;
            sportId: string;
            country: string | null;
            logoUrl: string | null;
            season: string | null;
            isFeatured: boolean;
            externalId: string | null;
            searchKey: string | null;
        })[];
        teams: never[] | ({
            sport: {
                name: string;
                createdAt: Date;
                sortOrder: number;
                id: string;
                updatedAt: Date;
                slug: string;
                icon: string | null;
                isActive: boolean;
            };
            _count: {
                homeMatches: number;
                awayMatches: number;
            };
        } & {
            name: string;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            countryCode: string | null;
            slug: string;
            isActive: boolean;
            sportId: string;
            country: string | null;
            logoUrl: string | null;
            externalId: string | null;
            shortName: string | null;
        })[];
        matches: never[] | ({
            league: {
                sport: {
                    name: string;
                    createdAt: Date;
                    sortOrder: number;
                    id: string;
                    updatedAt: Date;
                    slug: string;
                    icon: string | null;
                    isActive: boolean;
                };
            } & {
                name: string;
                createdAt: Date;
                sortOrder: number;
                id: string;
                updatedAt: Date;
                countryCode: string | null;
                slug: string;
                isActive: boolean;
                sportId: string;
                country: string | null;
                logoUrl: string | null;
                season: string | null;
                isFeatured: boolean;
                externalId: string | null;
                searchKey: string | null;
            };
            _count: {
                odds: number;
                betSelections: number;
            };
            homeTeam: {
                name: string;
                createdAt: Date;
                id: string;
                updatedAt: Date;
                countryCode: string | null;
                slug: string;
                isActive: boolean;
                sportId: string;
                country: string | null;
                logoUrl: string | null;
                externalId: string | null;
                shortName: string | null;
            };
            awayTeam: {
                name: string;
                createdAt: Date;
                id: string;
                updatedAt: Date;
                countryCode: string | null;
                slug: string;
                isActive: boolean;
                sportId: string;
                country: string | null;
                logoUrl: string | null;
                externalId: string | null;
                shortName: string | null;
            };
        } & {
            status: import("@prisma/client").$Enums.MatchStatus;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            result: import("@prisma/client/runtime/library").JsonValue;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            isFeatured: boolean;
            externalId: string | null;
            leagueId: string;
            awayTeamId: string;
            homeTeamId: string;
            startTime: Date;
            homeScore: number | null;
            awayScore: number | null;
            isLive: boolean;
            bettingEnabled: boolean;
            liveMinute: number | null;
            period: string | null;
        })[];
        meta: {
            total: number;
            query: string;
            limit: number;
            executionTime: number;
            counts: {
                leagues: number;
                teams: number;
                matches: number;
            };
        };
    }>;
    private clampLimit;
    private searchActiveLeagues;
    private searchActiveTeams;
    private searchUpcomingMatches;
    getSuggestions(query: string): Promise<{
        suggestions: never[];
        query?: undefined;
    } | {
        suggestions: ({
            type: "league";
            value: string;
            id: string;
        } | {
            type: "team";
            value: string;
            id: string;
        })[];
        query: string;
    }>;
}
