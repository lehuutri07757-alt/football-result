import { ApiPropertyOptional } from '@nestjs/swagger';
import { BetStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryAdminBetsDto {
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

  @ApiPropertyOptional({ enum: BetStatus, description: 'Filter by bet status' })
  @IsEnum(BetStatus)
  @IsOptional()
  status?: BetStatus;

  @ApiPropertyOptional({ description: 'Search by username or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'ISO date string (YYYY-MM-DD or full ISO)' })
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'ISO date string (YYYY-MM-DD or full ISO)' })
  @IsString()
  @IsOptional()
  toDate?: string;
}
