import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsObject,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum DataProviderStatus {
  active = 'active',
  inactive = 'inactive',
  error = 'error',
  maintenance = 'maintenance',
}

export enum DataProviderType {
  odds = 'odds',
  fixtures = 'fixtures',
  live_scores = 'live_scores',
  statistics = 'statistics',
  leagues = 'leagues',
  teams = 'teams',
}

export class CreateDataProviderDto {
  @ApiProperty({ example: 'api_football' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'API-Football' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Primary football data provider' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['odds', 'fixtures', 'live_scores'], enum: DataProviderType, isArray: true })
  @IsArray()
  @IsEnum(DataProviderType, { each: true })
  types: DataProviderType[];

  @ApiProperty({ example: 'https://v3.football.api-sports.io' })
  @IsString()
  baseUrl: string;

  @ApiPropertyOptional({ example: 'your-api-key-here' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: 'your-api-secret-here' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ example: { 'x-apisports-key': '{{apiKey}}' } })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ example: { timeout: 30000, retryCount: 3 } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: DataProviderStatus, default: DataProviderStatus.inactive })
  @IsOptional()
  @IsEnum(DataProviderStatus)
  status?: DataProviderStatus;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  monthlyLimit?: number;
}

export class UpdateDataProviderDto {
  @ApiPropertyOptional({ example: 'API-Football' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Primary football data provider' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['odds', 'fixtures'], enum: DataProviderType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DataProviderType, { each: true })
  types?: DataProviderType[];

  @ApiPropertyOptional({ example: 'https://v3.football.api-sports.io' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ example: 'your-api-key-here' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: 'your-api-secret-here' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ example: { 'x-apisports-key': '{{apiKey}}' } })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ example: { timeout: 30000, retryCount: 3 } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: DataProviderStatus })
  @IsOptional()
  @IsEnum(DataProviderStatus)
  status?: DataProviderStatus;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  monthlyLimit?: number;
}

export class QueryDataProviderDto {
  @ApiPropertyOptional({ enum: DataProviderStatus })
  @IsOptional()
  @IsEnum(DataProviderStatus)
  status?: DataProviderStatus;

  @ApiPropertyOptional({ enum: DataProviderType })
  @IsOptional()
  @IsEnum(DataProviderType)
  type?: DataProviderType;
}
