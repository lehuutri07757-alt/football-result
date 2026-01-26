import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisModule } from '@/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [HomeController],
  providers: [HomeService, PrismaService],
})
export class HomeModule {}

