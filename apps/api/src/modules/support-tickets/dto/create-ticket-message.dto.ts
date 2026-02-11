import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTicketMessageDto {
  @ApiProperty({ example: "I tried again and still the same issue." })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: "Mark as internal note (admin only)",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean = false;
}
