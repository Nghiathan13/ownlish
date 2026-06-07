import { IsDateString, IsInt, Max, Min } from 'class-validator';

export class UpdateVocabReviewDto {
  @IsInt()
  @Min(0)
  @Max(7)
  level: number;

  @IsInt()
  @Min(0)
  wrongCount: number;

  @IsDateString()
  lastReview: string;

  @IsDateString()
  nextReview: string;
}
