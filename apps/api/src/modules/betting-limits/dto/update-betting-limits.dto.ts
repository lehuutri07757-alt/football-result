import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBettingLimitsDto {
  @ApiPropertyOptional({ example: 1, description: 'Minimum bet amount (USD)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minBet?: number;

  @ApiPropertyOptional({ example: 10000, description: 'Maximum bet amount (USD)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxBet?: number;

  @ApiPropertyOptional({ example: 50000, description: 'Daily betting limit (USD)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyLimit?: number;

  @ApiPropertyOptional({ example: 200000, description: 'Weekly betting limit (USD)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weeklyLimit?: number;

  @ApiPropertyOptional({ example: 500000, description: 'Monthly betting limit (USD)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyLimit?: number;
}
