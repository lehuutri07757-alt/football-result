import { IsOptional, IsString, IsBoolean, IsInt, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryOddsDto {
  @ApiPropertyOptional({ description: 'Date in YYYY-MM-DD format' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Get live matches only', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  live?: boolean;

  @ApiPropertyOptional({ description: 'Filter by league IDs', type: [Number] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  leagueIds?: number[];

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class QueryFixtureOddsDto {
  @ApiPropertyOptional({ description: 'Bookmaker ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bookmakerId?: number;

  @ApiPropertyOptional({ description: 'Bet type ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  betId?: number;
}
