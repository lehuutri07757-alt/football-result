import { IsString, IsOptional, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum TicketCategory {
  ACCOUNT = "account",
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  BET = "bet",
  TECHNICAL = "technical",
  OTHER = "other",
}

export enum TicketPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export class CreateTicketDto {
  @ApiProperty({ example: "Cannot withdraw funds" })
  @IsString()
  subject: string;

  @ApiProperty({ enum: TicketCategory, example: TicketCategory.WITHDRAWAL })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.NORMAL })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority = TicketPriority.NORMAL;

  @ApiProperty({
    example: "I have been trying to withdraw but keep getting an error.",
  })
  @IsString()
  message: string;
}
