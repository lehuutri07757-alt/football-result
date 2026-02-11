import { IsOptional, IsInt, Min, Max, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class QueryTicketDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Filter by status: open, in_progress, resolved, closed",
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: "Filter by category" })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: "Filter by priority" })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: "Filter by user ID" })
  @IsString()
  @IsOptional()
  userId?: string;
}
