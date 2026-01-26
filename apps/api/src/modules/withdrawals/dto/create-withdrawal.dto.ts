import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 500000, description: 'Withdrawal amount' })
  @IsNumber()
  @Min(50000)
  amount: number;

  @ApiProperty({ example: 'Vietcombank' })
  @IsString()
  bankName: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'NGUYEN VAN A' })
  @IsString()
  accountName: string;
}
