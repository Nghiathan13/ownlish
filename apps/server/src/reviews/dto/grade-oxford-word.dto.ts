import { IsEnum } from 'class-validator';

export enum OxfordReviewRating {
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

export class GradeOxfordWordDto {
  @IsEnum(OxfordReviewRating)
  rating: OxfordReviewRating;
}
