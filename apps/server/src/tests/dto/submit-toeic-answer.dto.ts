import { IsIn, IsInt, IsPositive } from 'class-validator';

export class SubmitToeicAnswerDto {
  @IsInt()
  @IsPositive()
  toeicQuestionId!: number;

  @IsIn(['A', 'B', 'C', 'D'])
  selectedKey!: 'A' | 'B' | 'C' | 'D';
}
