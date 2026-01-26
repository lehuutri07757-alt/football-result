import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto, QueryTeamDto } from './dto';
export declare class TeamsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createTeamDto: CreateTeamDto): Promise<{
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
    }>;
    findAll(query: QueryTeamDto): Promise<{
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
    }>;
    update(id: string, updateTeamDto: UpdateTeamDto): Promise<{
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
    }>;
}
