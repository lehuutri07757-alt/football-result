import { IsOptional, IsString, IsInt, IsEnum, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ApiRequestStatusFilter {
  ALL = 'all',
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
}

export class QueryApiLogsDto {
  @ApiPropertyOptional({ description: 'Filter by endpoint', example: '/fixtures' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: ApiRequestStatusFilter,
    default: ApiRequestStatusFilter.ALL 
  })
  @IsOptional()
  @IsEnum(ApiRequestStatusFilter)
  status?: ApiRequestStatusFilter = ApiRequestStatusFilter.ALL;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
