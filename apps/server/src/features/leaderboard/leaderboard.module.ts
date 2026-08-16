import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../../users/users.module';
import { LeaderboardController } from './api/leaderboard.controller';
import { StudyTimeLeaderboardRepository } from './data/study-time-leaderboard.repository';
import { ExperienceLeaderboardRepository } from './data/experience-leaderboard.repository';
import { ExperienceLeaderboardService } from './model/experience-leaderboard.service';
import { StudyTimeLeaderboardService } from './model/study-time-leaderboard.service';

@Module({
  imports: [AuthModule, PrismaModule, UsersModule],
  controllers: [LeaderboardController],
  providers: [
    StudyTimeLeaderboardRepository,
    ExperienceLeaderboardRepository,
    StudyTimeLeaderboardService,
    ExperienceLeaderboardService,
  ],
})
export class LeaderboardModule {}
