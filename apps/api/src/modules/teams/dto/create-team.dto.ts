import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  sportId: string;

  @ApiProperty({ example: 'Manchester United' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'MUN' })
  @IsOptional()
  @IsString()
  shortName?: string;

  @ApiProperty({ example: 'manchester-united' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'England' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'GB' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
