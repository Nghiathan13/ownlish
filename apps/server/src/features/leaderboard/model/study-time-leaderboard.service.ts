import { Injectable } from '@nestjs/common';
import { ProfileAvatarStorageService } from '../../../users/profile-avatar-storage.service';
import { StudyTimeLeaderboardRepository } from '../data/study-time-leaderboard.repository';
import {
  formatLeaderboardDateKey,
  getStudyTimeLeaderboardRange,
} from './study-time-leaderboard-range';
import type {
  StudyTimeLeaderboardQuery,
  StudyTimeLeaderboardResponse,
} from './study-time-leaderboard.types';
import { toPublicLeaderProfile } from './public-leader-profile';

@Injectable()
export class StudyTimeLeaderboardService {
  constructor(
    private readonly studyTimeLeaderboardRepository: StudyTimeLeaderboardRepository,
    private readonly profileAvatarStorageService: ProfileAvatarStorageService,
  ) {}

  async getLeaderboard(
    query: StudyTimeLeaderboardQuery,
  ): Promise<StudyTimeLeaderboardResponse> {
    const range = getStudyTimeLeaderboardRange(query);
    const entries = await this.studyTimeLeaderboardRepository.getEntries(range);

    return {
      period: query.period,
      startsOn: range ? formatLeaderboardDateKey(range.startsOn) : null,
      endsOn: range ? formatLeaderboardDateKey(range.endsOn) : null,
      entries: entries.map((entry) => ({
        rank: entry.rank,
        ...toPublicLeaderProfile(entry, this.profileAvatarStorageService),
        studySeconds: entry.studySeconds,
      })),
    };
  }
}
