import { IsBoolean, IsString, Matches } from 'class-validator';

const SEGMENT_ID_PATTERN = /^s\d+$/;

export class SubmitDictationAnswerDto {
  @IsString()
  @Matches(SEGMENT_ID_PATTERN)
  segmentId!: string;

  @IsBoolean()
  isCompleted!: boolean;
}
