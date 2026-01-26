import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BalanceType {
  REAL = 'real',
  BONUS = 'bonus',
}

export enum AdjustmentType {
  ADD = 'add',
  SUBTRACT = 'subtract',
}

export class AdjustBalanceDto {
  @ApiProperty({ example: 100000, description: 'Amount to adjust' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: BalanceType, example: BalanceType.REAL })
  @IsEnum(BalanceType)
  balanceType: BalanceType;

  @ApiProperty({ enum: AdjustmentType, example: AdjustmentType.ADD })
  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType;

  @ApiPropertyOptional({ example: 'Manual adjustment by admin' })
  @IsString()
  @IsOptional()
  description?: string;
}
