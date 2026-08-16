import { Injectable } from '@nestjs/common';
import { ProfileAvatarStorageService } from '../../../users/profile-avatar-storage.service';
import { ExperienceLeaderboardRepository } from '../data/experience-leaderboard.repository';
import { toPublicLeaderProfile } from './public-leader-profile';
import type { ExperienceLeaderboardResponse } from './experience-leaderboard.types';

@Injectable()
export class ExperienceLeaderboardService {
  constructor(
    private readonly experienceLeaderboardRepository: ExperienceLeaderboardRepository,
    private readonly profileAvatarStorageService: ProfileAvatarStorageService,
  ) {}

  async getLeaderboard(): Promise<ExperienceLeaderboardResponse> {
    const entries = await this.experienceLeaderboardRepository.getEntries();

    return {
      entries: entries.map((entry) => ({
        rank: entry.rank,
        ...toPublicLeaderProfile(entry, this.profileAvatarStorageService),
        experience: entry.experience,
      })),
    };
  }
}
