import { IsString, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAgentDto {
  @ApiPropertyOptional({ example: 5.00, description: 'Commission rate percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionRate?: number;

  @ApiPropertyOptional({ enum: ['active', 'suspended', 'blocked'] })
  @IsString()
  @IsOptional()
  status?: string;

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
