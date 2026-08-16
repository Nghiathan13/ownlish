import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../../users/users.module';
import { LeaderboardController } from './api/leaderboard.controller';
import { StudyTimeLeaderboardRepository } from './data/study-time-leaderboard.repository';
import { ExperienceLeaderboardRepository } from './data/experience-leaderboard.repository';
import { ExperienceLeaderboardService } from './model/experience-leaderboard.service';
import { StudyTimeLeaderboardService } from './model/study-time-leaderboard.service';
import { LeaderboardModule } from './leaderboard.module';

describe('LeaderboardModule', () => {
  it('wires its API, data, model, and required feature dependencies', () => {
    expect(
      Reflect.getMetadata(MODULE_METADATA.IMPORTS, LeaderboardModule),
    ).toEqual([AuthModule, PrismaModule, UsersModule]);
    expect(
      Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, LeaderboardModule),
    ).toEqual([LeaderboardController]);
    expect(
      Reflect.getMetadata(MODULE_METADATA.PROVIDERS, LeaderboardModule),
    ).toEqual([
      StudyTimeLeaderboardRepository,
      ExperienceLeaderboardRepository,
      StudyTimeLeaderboardService,
      ExperienceLeaderboardService,
    ]);
  });
});
