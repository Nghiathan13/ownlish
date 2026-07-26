import { IsEnum } from 'class-validator';
import {
  REVIEW_RATINGS,
  type ReviewRating,
} from '../../reviews/lib/review-schedule';

export class UpdateVocabReviewDto {
  @IsEnum(REVIEW_RATINGS)
  rating: ReviewRating;
}
