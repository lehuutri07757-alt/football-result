import { IsInt, Min, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus } from '@prisma/client';

export class UpdateScoreDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  homeScore: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  awayScore: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  @Min(0)
  liveMinute?: number;

  @ApiPropertyOptional({ example: '1st Half' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ enum: MatchStatus })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;
}
