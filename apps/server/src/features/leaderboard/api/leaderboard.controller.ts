import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { StudyTimeLeaderboardQueryDto } from './dto/study-time-leaderboard-query.dto';
import { ExperienceLeaderboardService } from '../model/experience-leaderboard.service';
import { StudyTimeLeaderboardService } from '../model/study-time-leaderboard.service';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(
    private readonly studyTimeLeaderboardService: StudyTimeLeaderboardService,
    private readonly experienceLeaderboardService: ExperienceLeaderboardService,
  ) {}

  @Get('study-time')
  getStudyTimeLeaderboard(@Query() query: StudyTimeLeaderboardQueryDto) {
    return this.studyTimeLeaderboardService.getLeaderboard({
      period: query.period,
      anchor: query.anchor,
    });
  }

  @Get('experience')
  getExperienceLeaderboard() {
    return this.experienceLeaderboardService.getLeaderboard();
  }
}
