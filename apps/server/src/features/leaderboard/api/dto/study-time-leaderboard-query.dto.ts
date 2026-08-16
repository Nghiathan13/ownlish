import { IsIn, IsOptional, Matches } from 'class-validator';
import {
  STUDY_TIME_LEADERBOARD_PERIODS,
  type StudyTimeLeaderboardPeriod,
} from '../../model/study-time-leaderboard.types';

export { STUDY_TIME_LEADERBOARD_PERIODS };
export type { StudyTimeLeaderboardPeriod };

export class StudyTimeLeaderboardQueryDto {
  @IsIn(STUDY_TIME_LEADERBOARD_PERIODS)
  period!: StudyTimeLeaderboardPeriod;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  anchor?: string;
}
