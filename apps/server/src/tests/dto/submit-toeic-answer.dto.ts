import { IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';

export class SubmitToeicAnswerDto {
  @IsInt()
  @IsPositive()
  toeicQuestionId!: number;

  @IsIn(['A', 'B', 'C', 'D'])
  selectedKey!: 'A' | 'B' | 'C' | 'D';

  @IsOptional()
  @IsIn(['practice', 'review_wrong', 'mock_test'])
  mode?: 'practice' | 'review_wrong' | 'mock_test';
}
