import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';

class ReviewGroupAnswerDto {
  @IsInt()
  @IsPositive()
  toeicQuestionId!: number;

  @IsIn(['A', 'B', 'C', 'D'])
  selectedKey!: 'A' | 'B' | 'C' | 'D';
}

export class SubmitReviewGroupAnswersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReviewGroupAnswerDto)
  answers!: ReviewGroupAnswerDto[];
}
