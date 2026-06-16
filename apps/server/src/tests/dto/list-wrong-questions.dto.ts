import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ListWrongQuestionsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  testId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  partNumber: number;
}
