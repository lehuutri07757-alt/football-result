import { FeaturedMatchesService, FeaturedMatchesSettings } from './featured-matches.service';
export declare class FeaturedMatchesController {
    private featuredMatchesService;
    constructor(featuredMatchesService: FeaturedMatchesService);
    getFeaturedMatches(): Promise<({
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
    })[]>;
    getSettings(): Promise<FeaturedMatchesSettings>;
    updateSettings(settings: Partial<FeaturedMatchesSettings>): Promise<FeaturedMatchesSettings>;
    getStats(): Promise<import("./featured-matches.service").FeaturedMatchesStats>;
    autoSelect(): Promise<{
        updated: number;
    }>;
    toggleFeatured(matchId: string): Promise<{
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
    }>;
    batchUpdate(body: {
        matchIds: string[];
        featured: boolean;
    }): Promise<{
        updated: number;
    }>;
    getAvailableLeagues(): Promise<({
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
    })[]>;
    getAvailableTeams(leagueId?: string): Promise<({
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
    })[]>;
}
