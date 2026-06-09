import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_VOCAB_LEVEL, MIN_VOCAB_LEVEL } from '../vocab.constants';

export class UpdateVocabReviewDto {
  @IsInt()
  @Min(MIN_VOCAB_LEVEL)
  @Max(MAX_VOCAB_LEVEL)
  level: number;

  @IsInt()
  @Min(0)
  wrongCount: number;

  @IsDateString()
  lastReview: string;

  @IsOptional()
  @IsDateString()
  nextReview: string | null;
}
