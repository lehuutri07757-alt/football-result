import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { QueryHomeFeedDto } from './dto';
import { HomeFeedEntity } from './entities/home-feed.entity';
export declare class HomeService {
    private readonly prisma;
    private readonly redisService;
    constructor(prisma: PrismaService, redisService: RedisService);
    getFeed(query: QueryHomeFeedDto): Promise<HomeFeedEntity>;
    private buildCacheKey;
}
