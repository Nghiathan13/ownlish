import { IsEnum, IsUUID } from 'class-validator';
import {
  REVIEW_ACTIONS,
  type ReviewAction,
} from '../../reviews/lib/review-schedule';

export class UpdateVocabReviewDto {
  @IsEnum(REVIEW_ACTIONS)
  rating: ReviewAction;

  @IsUUID('4')
  submissionId: string;
}
