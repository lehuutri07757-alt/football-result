import { IsNumber, IsString, IsOptional, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  E_WALLET = 'e_wallet',
  CRYPTO = 'crypto',
}

export class CreateDepositDto {
  @ApiProperty({ example: 1000000, description: 'Deposit amount' })
  @IsNumber()
  @Min(10000)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'Vietcombank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'NGUYEN VAN A' })
  @IsString()
  @IsOptional()
  accountName?: string;

  @ApiPropertyOptional({ example: 'NAP123456' })
  @IsString()
  @IsOptional()
  transferContent?: string;

  @ApiPropertyOptional({ description: 'URL of payment proof image' })
  @IsString()
  @IsOptional()
  proofImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
