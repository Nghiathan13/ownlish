import { IsEnum, IsUUID } from 'class-validator';
import { REVIEW_ACTIONS, type ReviewAction } from '../lib/review-schedule';

export class GradeOxfordWordDto {
  @IsEnum(REVIEW_ACTIONS)
  rating: ReviewAction;

  @IsUUID('4')
  submissionId: string;
}
