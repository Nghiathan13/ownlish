import { IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreatePracticeSessionDto {
  @IsInt()
  @IsPositive()
  testId!: number;

  @IsInt()
  @IsPositive()
  partNumber!: number;

  @IsOptional()
  @IsIn(['normal', 'wrong_questions'])
  mode?: 'normal' | 'wrong_questions';
}
