import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

const SEGMENT_ID_PATTERN = /^s\d+$/;

export class SubmitDictationAnswerDto {
  @IsString()
  @Matches(SEGMENT_ID_PATTERN)
  segmentId!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Matches(SEGMENT_ID_PATTERN)
  nextSegmentId?: string | null;
}
