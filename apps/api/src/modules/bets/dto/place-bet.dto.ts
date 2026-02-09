import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class PlaceBetDto {
  @ApiProperty({ example: '43cf4eb2-a1e3-45dd-986f-12c9b165f947' })
  @IsString()
  @IsNotEmpty()
  oddsId: string;

  @ApiProperty({ example: 50000, description: 'Stake amount in VND' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000000000)
  stake: number;

  @ApiProperty({ example: 'mobile-1738217-abc123' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}

