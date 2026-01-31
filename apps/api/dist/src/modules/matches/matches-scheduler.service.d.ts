import { PrismaService } from '../../prisma/prisma.service';
export declare class MatchesSchedulerService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    autoEndStaleLiveMatches(): Promise<void>;
}
