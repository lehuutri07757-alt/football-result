import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeagueDto, UpdateLeagueDto, QueryLeagueDto, ReorderLeaguesDto } from './dto';
export declare class LeaguesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createLeagueDto: CreateLeagueDto): Promise<{
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
    }>;
    findAll(query: QueryLeagueDto): Promise<{
        data: ({
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
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findBySport(sportId: string): Promise<({
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
    })[]>;
    findFeatured(): Promise<({
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
    })[]>;
    findOne(id: string): Promise<{
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
    }>;
    update(id: string, updateLeagueDto: UpdateLeagueDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    toggleActive(id: string): Promise<{
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
    }>;
    toggleFeatured(id: string): Promise<{
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
    }>;
    inactiveAll(): Promise<{
        message: string;
        count: number;
    }>;
    reorder(reorderDto: ReorderLeaguesDto): Promise<{
        message: string;
    }>;
}
