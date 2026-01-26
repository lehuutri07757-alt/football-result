import { LeaguesService } from './leagues.service';
import { CreateLeagueDto, UpdateLeagueDto, QueryLeagueDto, ReorderLeaguesDto } from './dto';
export declare class LeaguesController {
    private leaguesService;
    constructor(leaguesService: LeaguesService);
    findAll(query: QueryLeagueDto): Promise<{
        data: ({
            sport: {
                id: string;
                name: string;
                slug: string;
                sortOrder: number;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
            };
            _count: {
                matches: number;
            };
        } & {
            id: string;
            name: string;
            slug: string;
            country: string | null;
            countryCode: string | null;
            logoUrl: string | null;
            season: string | null;
            sortOrder: number;
            isActive: boolean;
            isFeatured: boolean;
            externalId: string | null;
            createdAt: Date;
            updatedAt: Date;
            sportId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findFeatured(): Promise<({
        sport: {
            id: string;
            name: string;
            slug: string;
            sortOrder: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        country: string | null;
        countryCode: string | null;
        logoUrl: string | null;
        season: string | null;
        sortOrder: number;
        isActive: boolean;
        isFeatured: boolean;
        externalId: string | null;
        createdAt: Date;
        updatedAt: Date;
        sportId: string;
    })[]>;
    findBySport(sportId: string): Promise<({
        sport: {
            id: string;
            name: string;
            slug: string;
            sortOrder: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        country: string | null;
        countryCode: string | null;
        logoUrl: string | null;
        season: string | null;
        sortOrder: number;
        isActive: boolean;
        isFeatured: boolean;
        externalId: string | null;
        createdAt: Date;
        updatedAt: Date;
        sportId: string;
    })[]>;
    findOne(id: string): Promise<{
        sport: {
            id: string;
            name: string;
            slug: string;
            sortOrder: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        };
        _count: {
            matches: number;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        country: string | null;
        countryCode: string | null;
        logoUrl: string | null;
        season: string | null;
        sortOrder: number;
        isActive: boolean;
        isFeatured: boolean;
        externalId: string | null;
        createdAt: Date;
        updatedAt: Date;
        sportId: string;
    }>;
    create(createLeagueDto: CreateLeagueDto): Promise<{
        sport: {
            id: string;
            name: string;
            slug: string;
            sortOrder: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        country: string | null;
        countryCode: string | null;
        logoUrl: string | null;
        season: string | null;
        sortOrder: number;
        isActive: boolean;
        isFeatured: boolean;
        externalId: string | null;
        createdAt: Date;
        updatedAt: Date;
        sportId: string;
    }>;
    update(id: string, updateLeagueDto: UpdateLeagueDto): Promise<{
        sport: {
            id: string;
            name: string;
            slug: string;
            sortOrder: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        country: string | null;
        countryCode: string | null;
        logoUrl: string | null;
        season: string | null;
        sortOrder: number;
        isActive: boolean;
        isFeatured: boolean;
        externalId: string | null;
        createdAt: Date;
        updatedAt: Date;
        sportId: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    toggleActive(id: string): Promise<{
        sport: {
            id: string;
            name: string;
            slug: string;
            sortOrder: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        country: string | null;
        countryCode: string | null;
        logoUrl: string | null;
        season: string | null;
        sortOrder: number;
        isActive: boolean;
        isFeatured: boolean;
        externalId: string | null;
        createdAt: Date;
        updatedAt: Date;
        sportId: string;
    }>;
    toggleFeatured(id: string): Promise<{
        sport: {
            id: string;
            name: string;
            slug: string;
            sortOrder: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        country: string | null;
        countryCode: string | null;
        logoUrl: string | null;
        season: string | null;
        sortOrder: number;
        isActive: boolean;
        isFeatured: boolean;
        externalId: string | null;
        createdAt: Date;
        updatedAt: Date;
        sportId: string;
    }>;
    inactiveAll(): Promise<{
        message: string;
        count: number;
    }>;
    reorder(reorderDto: ReorderLeaguesDto): Promise<{
        message: string;
    }>;
}
