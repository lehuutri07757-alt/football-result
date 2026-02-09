import { ApiPropertyOptional } from '@nestjs/swagger';
import { BetStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryMyBetsDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: BetStatus })
  @IsEnum(BetStatus)
  @IsOptional()
  status?: BetStatus;

  @ApiPropertyOptional({ description: 'ISO date string (YYYY-MM-DD or full ISO)' })
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'ISO date string (YYYY-MM-DD or full ISO)' })
  @IsString()
  @IsOptional()
  toDate?: string;
}

