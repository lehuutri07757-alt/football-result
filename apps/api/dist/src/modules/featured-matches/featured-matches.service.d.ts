import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export interface FeaturedMatchesSettings {
    featuredLeagueIds: string[];
    topTeamRankThreshold: number;
    topTeamIds: string[];
    derbyPairs: {
        homeTeamId: string;
        awayTeamId: string;
        name?: string;
    }[];
    maxFeaturedMatches: number;
    autoSelectEnabled: boolean;
    includeUpcoming: boolean;
    includeLive: boolean;
    upcomingHours: number;
}
export interface FeaturedMatchesStats {
    totalFeatured: number;
    byLeague: {
        leagueId: string;
        leagueName: string;
        count: number;
    }[];
    byStatus: {
        status: string;
        count: number;
    }[];
    liveCount: number;
    upcomingCount: number;
}
export declare class FeaturedMatchesService {
    private prisma;
    private readonly SETTINGS_KEY;
    constructor(prisma: PrismaService);
    getSettings(): Promise<FeaturedMatchesSettings>;
    updateSettings(settings: Partial<FeaturedMatchesSettings>): Promise<FeaturedMatchesSettings>;
    private getDefaultSettings;
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
        result: Prisma.JsonValue;
        metadata: Prisma.JsonValue;
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
    getStats(): Promise<FeaturedMatchesStats>;
    autoSelectFeaturedMatches(): Promise<{
        updated: number;
    }>;
    toggleMatchFeatured(matchId: string): Promise<{
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
        result: Prisma.JsonValue;
        metadata: Prisma.JsonValue;
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
    batchUpdateFeatured(matchIds: string[], featured: boolean): Promise<{
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
