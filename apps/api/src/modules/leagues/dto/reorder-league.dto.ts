import { IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class LeagueOrderItem {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderLeaguesDto {
  @ApiProperty({
    type: [LeagueOrderItem],
    description: 'Array of league IDs with their new sort orders',
    example: [
      { id: 'uuid-1', sortOrder: 0 },
      { id: 'uuid-2', sortOrder: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeagueOrderItem)
  items: LeagueOrderItem[];
}
