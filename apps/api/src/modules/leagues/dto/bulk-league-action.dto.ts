import { IsArray, IsUUID, IsBoolean, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkLeagueIdsDto {
  @ApiProperty({
    type: [String],
    description: 'Array of league IDs to perform action on',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids: string[];
}

export class BulkLeagueUpdateDto extends BulkLeagueIdsDto {
  @ApiProperty({
    description: 'Value to set for the selected leagues',
    example: true,
  })
  @IsBoolean()
  value: boolean;
}
