import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class QueryNotificationDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: "Filter by read status: true/false" })
  @IsOptional()
  isRead?: string;

  @ApiPropertyOptional({ description: "Filter by notification type" })
  @IsString()
  @IsOptional()
  type?: string;
}
