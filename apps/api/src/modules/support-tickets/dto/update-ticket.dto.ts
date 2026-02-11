import { IsString, IsOptional, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @ApiPropertyOptional({ description: "Assigned admin user ID" })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: "Priority" })
  @IsString()
  @IsOptional()
  priority?: string;
}
