import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CompleteAttemptPartDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  correctCount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  wrongCount!: number;
}
