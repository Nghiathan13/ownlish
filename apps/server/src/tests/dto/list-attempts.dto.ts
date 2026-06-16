import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ListAttemptsDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  testId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
