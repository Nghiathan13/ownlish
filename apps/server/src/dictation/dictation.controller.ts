import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { SubmitDictationAnswerDto } from './dto/submit-dictation-answer.dto';
import { DictationService } from './dictation.service';

@Controller('dictation/videos')
@UseGuards(JwtAuthGuard)
export class DictationController {
  constructor(private readonly dictationService: DictationService) {}

  @Get(':videoId/progress')
  getProgress(@Req() request: AuthRequest, @Param('videoId') videoId: string) {
    return this.dictationService.getProgress(request.user.id, videoId);
  }

  @Post(':videoId/answers')
  submitAnswer(
    @Req() request: AuthRequest,
    @Param('videoId') videoId: string,
    @Body() dto: SubmitDictationAnswerDto,
  ) {
    return this.dictationService.submitAnswer(request.user.id, videoId, dto);
  }

  @Delete(':videoId/progress')
  resetProgress(
    @Req() request: AuthRequest,
    @Param('videoId') videoId: string,
  ) {
    return this.dictationService.resetProgress(request.user.id, videoId);
  }
}
