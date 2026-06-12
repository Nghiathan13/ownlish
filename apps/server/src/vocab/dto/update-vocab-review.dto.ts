import { IsISO8601, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_VOCAB_LEVEL, MIN_VOCAB_LEVEL } from '../vocab.constants';

export class UpdateVocabReviewDto {
  @IsInt()
  @Min(MIN_VOCAB_LEVEL)
  @Max(MAX_VOCAB_LEVEL)
  level: number;

  @IsInt()
  @Min(0)
  wrongCount: number;

  @IsISO8601()
  lastReview: string;

  @IsOptional()
  @IsISO8601()
  nextReview: string | null;
}
