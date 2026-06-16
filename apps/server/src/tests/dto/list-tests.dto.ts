import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class ListTestsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  year = 2026;
}
