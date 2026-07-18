import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class SubmitToeicRuntimeAnswerDto {
  @IsString()
  @Matches(/^(ets|ybm)\d{2}-t\d{2}-p[1-7]-q\d{3}$/)
  questionKey!: string;

  @IsIn(['A', 'B', 'C', 'D'])
  selectedKey!: 'A' | 'B' | 'C' | 'D';

  @IsOptional()
  @IsIn(['review_wrong'])
  mode?: 'review_wrong';
}
