import { IsEnum } from 'class-validator';
import { REVIEW_RATINGS, type ReviewRating } from '../lib/review-schedule';

export class GradeOxfordWordDto {
  @IsEnum(REVIEW_RATINGS)
  rating: ReviewRating;
}
