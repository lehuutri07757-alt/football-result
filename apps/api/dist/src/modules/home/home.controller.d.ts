import { HomeService } from './home.service';
import { QueryHomeFeedDto } from './dto';
import { HomeFeedEntity } from './entities/home-feed.entity';
export declare class HomeController {
    private readonly homeService;
    constructor(homeService: HomeService);
    getFeed(query: QueryHomeFeedDto): Promise<HomeFeedEntity>;
}
