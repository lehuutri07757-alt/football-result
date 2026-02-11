import { IsString, IsOptional, IsEnum, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum NotificationType {
  SYSTEM = "system",
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  BET = "bet",
  PROMOTION = "promotion",
  ACCOUNT = "account",
}

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: "Target user ID. Null for broadcast." })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.SYSTEM })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: "Deposit Approved" })
  @IsString()
  title: string;

  @ApiProperty({ example: "Your deposit of $100 has been approved." })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: "/wallet" })
  @IsString()
  @IsOptional()
  actionUrl?: string;
}
