import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DepositAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ProcessDepositDto {
  @ApiProperty({ enum: DepositAction })
  @IsEnum(DepositAction)
  action: DepositAction;

  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsString()
  @IsOptional()
  rejectReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
