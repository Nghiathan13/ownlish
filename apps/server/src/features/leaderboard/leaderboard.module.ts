import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../../users/users.module';
import { LeaderboardController } from './api/leaderboard.controller';
import { StudyTimeLeaderboardRepository } from './data/study-time-leaderboard.repository';
import { LeaderboardService } from './model/leaderboard.service';

@Module({
  imports: [AuthModule, PrismaModule, UsersModule],
  controllers: [LeaderboardController],
  providers: [StudyTimeLeaderboardRepository, LeaderboardService],
})
export class LeaderboardModule {}
