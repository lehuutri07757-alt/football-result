import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Global search across leagues, teams, and matches',
    description: 'Search for leagues, teams, and matches simultaneously with a single query'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results grouped by entity type',
    schema: {
      example: {
        leagues: [
          { id: '123', name: 'Premier League', country: 'England', logoUrl: '...' }
        ],
        teams: [
          { id: '456', name: 'Manchester United', logoUrl: '...' }
        ],
        matches: [
          { id: '789', homeTeam: { name: 'Arsenal' }, awayTeam: { name: 'Chelsea' }, startTime: '2024-02-15T15:00:00Z' }
        ],
        meta: {
          total: 15,
          query: 'manchester',
          executionTime: 45
        }
      }
    }
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (minimum 2 characters)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results limit per entity type', type: Number })
  async globalSearch(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.globalSearch(query, limit);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions/autocomplete' })
  @ApiResponse({ status: 200, description: 'Suggested search terms' })
  @ApiQuery({ name: 'q', required: true, description: 'Partial search query' })
  async getSuggestions(@Query('q') query: string) {
    return this.searchService.getSuggestions(query);
  }
}
