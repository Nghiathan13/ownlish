import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { CreateToeicSessionDto } from './dto/create-toeic-session.dto';
import { ListTestsDto } from './dto/list-tests.dto';
import { RefreshMediaDto } from './dto/refresh-media.dto';
import { SubmitToeicAnswerDto } from './dto/submit-toeic-answer.dto';
import { PracticeService } from './practice.service';
import { TestsService } from './tests.service';

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
    private readonly practiceService: PracticeService,
  ) {}

  @Get()
  list(@Req() request: AuthRequest, @Query() query: ListTestsDto) {
    return this.testsService.listTests(request.user.id, query.year);
  }

  @Post('practice/sessions')
  createSession(
    @Req() request: AuthRequest,
    @Body() dto: CreateToeicSessionDto,
  ) {
    return this.practiceService.createSession(request.user.id, dto);
  }

  @Post('practice/sessions/:sessionId/answers')
  submitAnswer(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: SubmitToeicAnswerDto,
  ) {
    return this.practiceService.submitAnswer(request.user.id, sessionId, dto);
  }

  @Patch('practice/sessions/:sessionId/complete')
  completeSession(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ) {
    return this.practiceService.completeSession(request.user.id, sessionId);
  }

  @Delete(':testId/practice-history')
  clearPracticeHistory(
    @Req() request: AuthRequest,
    @Param('testId', ParseIntPipe) testId: number,
  ) {
    return this.practiceService.clearTestHistory(request.user.id, testId);
  }

  @Get(':testId/parts/:partNumber')
  getPart(
    @Param('testId', ParseIntPipe) testId: number,
    @Param('partNumber', ParseIntPipe) partNumber: number,
  ) {
    return this.testsService.getPart(testId, partNumber);
  }

  @Post(':testId/parts/:partNumber/refresh-media')
  refreshMedia(
    @Param('testId', ParseIntPipe) testId: number,
    @Param('partNumber', ParseIntPipe) partNumber: number,
    @Body() dto: RefreshMediaDto,
  ) {
    return this.testsService.refreshMedia(testId, partNumber, dto);
  }
}
