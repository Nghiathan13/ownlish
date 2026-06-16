import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateAttemptDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  testId!: number;
}
