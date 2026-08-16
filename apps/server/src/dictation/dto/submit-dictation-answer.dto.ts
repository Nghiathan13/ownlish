import { IsString, Matches, MaxLength } from 'class-validator';

const SEGMENT_ID_PATTERN = /^s\d+$/;

export class SubmitDictationAnswerDto {
  @IsString()
  @Matches(SEGMENT_ID_PATTERN)
  segmentId!: string;

  @IsString()
  @MaxLength(5_000)
  answer!: string;
}
