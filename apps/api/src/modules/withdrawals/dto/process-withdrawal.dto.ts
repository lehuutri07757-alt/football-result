import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WithdrawalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ProcessWithdrawalDto {
  @ApiProperty({ enum: WithdrawalAction })
  @IsEnum(WithdrawalAction)
  action: WithdrawalAction;

  @ApiPropertyOptional({ description: 'Transaction reference (for approved)' })
  @IsString()
  @IsOptional()
  transactionRef?: string;

  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsString()
  @IsOptional()
  rejectReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
