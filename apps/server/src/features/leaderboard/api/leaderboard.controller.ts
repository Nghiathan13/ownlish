import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { StudyTimeLeaderboardQueryDto } from './dto/study-time-leaderboard-query.dto';
import { LeaderboardService } from '../model/leaderboard.service';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('study-time')
  getStudyTimeLeaderboard(@Query() query: StudyTimeLeaderboardQueryDto) {
    return this.leaderboardService.getStudyTimeLeaderboard({
      period: query.period,
      anchor: query.anchor,
    });
  }
}
