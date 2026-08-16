import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import type { AuthRequest } from '../../../auth/types/auth.types';
import { ExperienceSummaryService } from '../model/experience-summary.service';

@Controller('experience')
@UseGuards(JwtAuthGuard)
export class ExperienceController {
  constructor(
    private readonly experienceSummaryService: ExperienceSummaryService,
  ) {}

  @Get('summary')
  getSummary(@Req() request: AuthRequest) {
    return this.experienceSummaryService.getSummary(request.user.id);
  }
}
