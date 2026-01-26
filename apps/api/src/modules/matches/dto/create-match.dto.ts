import { IsString, IsOptional, IsBoolean, IsUUID, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus } from '@prisma/client';

export class CreateMatchDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  leagueId: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  homeTeamId: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  awayTeamId: string;

  @ApiProperty({ example: '2024-12-20T22:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ enum: MatchStatus, example: 'scheduled' })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  homeScore?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  awayScore?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isLive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  bettingEnabled?: boolean;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  @Min(0)
  liveMinute?: number;

  @ApiPropertyOptional({ example: '1st Half' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;
}
