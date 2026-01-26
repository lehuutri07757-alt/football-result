import { IsString, IsOptional, IsNumber, IsUUID, Min, Max, MinLength, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ example: 'agent001' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiPropertyOptional({ example: 'agent@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Parent agent ID (for sub-agents)' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ example: 5.00, description: 'Commission rate percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Agent betting limits configuration' })
  @IsOptional()
  bettingLimits?: {
    minBet?: number;
    maxBet?: number;
    dailyLimit?: number;
    weeklyLimit?: number;
    monthlyLimit?: number;
  };
}
