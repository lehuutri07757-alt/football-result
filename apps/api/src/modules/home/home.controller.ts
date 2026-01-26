import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { QueryHomeFeedDto } from './dto';
import { HomeFeedEntity } from './entities/home-feed.entity';

@ApiTags('Home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get home feed (hot leagues + top live matches + odds snapshot)' })
  @ApiResponse({ status: 200, type: HomeFeedEntity })
  async getFeed(@Query() query: QueryHomeFeedDto): Promise<HomeFeedEntity> {
    return this.homeService.getFeed(query);
  }
}

