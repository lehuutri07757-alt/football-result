import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum MatchListType {
  UPCOMING = 'upcoming',
  FINISHED = 'finished',
}

export class QueryTeamMatchesDto {
  @ApiPropertyOptional({ enum: MatchListType, example: MatchListType.UPCOMING })
  @IsOptional()
  @IsEnum(MatchListType)
  type?: MatchListType;

  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
