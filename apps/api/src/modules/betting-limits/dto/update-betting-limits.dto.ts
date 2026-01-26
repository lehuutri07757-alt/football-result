import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBettingLimitsDto {
  @ApiPropertyOptional({ example: 10000, description: 'Minimum bet amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minBet?: number;

  @ApiPropertyOptional({ example: 10000000, description: 'Maximum bet amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxBet?: number;

  @ApiPropertyOptional({ example: 100000000, description: 'Daily betting limit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyLimit?: number;

  @ApiPropertyOptional({ example: 500000000, description: 'Weekly betting limit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weeklyLimit?: number;

  @ApiPropertyOptional({ example: 2000000000, description: 'Monthly betting limit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyLimit?: number;
}
