import { Module } from '@nestjs/common';
import { FeaturedMatchesController } from './featured-matches.controller';
import { FeaturedMatchesService } from './featured-matches.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeaturedMatchesController],
  providers: [FeaturedMatchesService],
  exports: [FeaturedMatchesService],
})
export class FeaturedMatchesModule {}
