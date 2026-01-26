import { PrismaService } from '../../prisma/prisma.service';
import { CreateSportDto, UpdateSportDto, QuerySportDto } from './dto';
export declare class SportsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createSportDto: CreateSportDto): Promise<{
        name: string;
        createdAt: Date;
        sortOrder: number;
        id: string;
        updatedAt: Date;
        slug: string;
        icon: string | null;
        isActive: boolean;
    }>;
    findAll(query: QuerySportDto): Promise<{
        data: ({
            _count: {
                leagues: number;
                teams: number;
            };
        } & {
            name: string;
            createdAt: Date;
            sortOrder: number;
            id: string;
            updatedAt: Date;
            slug: string;
            icon: string | null;
            isActive: boolean;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findAllActive(): Promise<{
        name: string;
        createdAt: Date;
        sortOrder: number;
        id: string;
        updatedAt: Date;
        slug: string;
        icon: string | null;
        isActive: boolean;
    }[]>;
    findOne(id: string): Promise<{
        _count: {
            leagues: number;
            teams: number;
        };
    } & {
        name: string;
        createdAt: Date;
        sortOrder: number;
        id: string;
        updatedAt: Date;
        slug: string;
        icon: string | null;
        isActive: boolean;
    }>;
    findBySlug(slug: string): Promise<{
        name: string;
        createdAt: Date;
        sortOrder: number;
        id: string;
        updatedAt: Date;
        slug: string;
        icon: string | null;
        isActive: boolean;
    }>;
    update(id: string, updateSportDto: UpdateSportDto): Promise<{
        name: string;
        createdAt: Date;
        sortOrder: number;
        id: string;
        updatedAt: Date;
        slug: string;
        icon: string | null;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    toggleActive(id: string): Promise<{
        name: string;
        createdAt: Date;
        sortOrder: number;
        id: string;
        updatedAt: Date;
        slug: string;
        icon: string | null;
        isActive: boolean;
    }>;
}
