import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import type { AuthRequest } from '../../../auth/types/auth.types';
import { SubmitLearningActivityCheckpointDto } from './dto/submit-learning-activity-checkpoint.dto';
import { LearningActivityService } from '../model/learning-activity.service';

@Controller('learning-activity')
@UseGuards(JwtAuthGuard)
export class LearningActivityController {
  constructor(
    private readonly learningActivityService: LearningActivityService,
  ) {}

  @Get('calendar')
  getCalendar(@Req() request: AuthRequest) {
    return this.learningActivityService.getCalendar(request.user.id);
  }

  @Post('checkpoints')
  submitCheckpoint(
    @Req() request: AuthRequest,
    @Body() dto: SubmitLearningActivityCheckpointDto,
  ) {
    return this.learningActivityService.submitCheckpoint(request.user.id, dto);
  }
}
