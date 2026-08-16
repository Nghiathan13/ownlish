import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../../users/users.module';
import { LeaderboardController } from './api/leaderboard.controller';
import { StudyTimeLeaderboardRepository } from './data/study-time-leaderboard.repository';
import { LeaderboardService } from './model/leaderboard.service';
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
    ).toEqual([StudyTimeLeaderboardRepository, LeaderboardService]);
  });
});
