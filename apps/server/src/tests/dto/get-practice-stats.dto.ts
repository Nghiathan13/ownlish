import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetPracticeStatsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  testId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  partNumber?: number;
}
