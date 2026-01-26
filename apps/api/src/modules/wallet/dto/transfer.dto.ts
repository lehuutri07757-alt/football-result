import { IsNumber, IsString, IsUUID, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsUUID()
  toUserId: string;

  @ApiProperty({ example: 100000, description: 'Amount to transfer' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'Transfer to user' })
  @IsString()
  @IsOptional()
  description?: string;
}
