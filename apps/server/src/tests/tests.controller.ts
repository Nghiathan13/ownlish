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
import { CreatePracticeSessionDto } from './dto/create-practice-session.dto';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { CompleteAttemptPartDto } from './dto/complete-attempt-part.dto';
import { GetPracticeStatsDto } from './dto/get-practice-stats.dto';
import { ListAttemptsDto } from './dto/list-attempts.dto';
import { ListTestsDto } from './dto/list-tests.dto';
import { ListWrongQuestionsDto } from './dto/list-wrong-questions.dto';
import { RefreshMediaDto } from './dto/refresh-media.dto';
import { SubmitPracticeAnswerDto } from './dto/submit-practice-answer.dto';
import { PracticeService } from './practice.service';
import { AttemptService } from './attempt.service';
import { TestsService } from './tests.service';

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
    private readonly practiceService: PracticeService,
    private readonly attemptService: AttemptService,
  ) {}

  @Get()
  list(@Query() query: ListTestsDto) {
    return this.testsService.listTests(query.year);
  }

  @Post('practice/sessions')
  createSession(
    @Req() request: AuthRequest,
    @Body() dto: CreatePracticeSessionDto,
  ) {
    return this.practiceService.createSession(request.user.id, dto);
  }

  @Get('practice/wrong-questions')
  listWrongQuestions(
    @Req() request: AuthRequest,
    @Query() query: ListWrongQuestionsDto,
  ) {
    return this.practiceService.listWrongQuestions(
      request.user.id,
      query.testId,
      query.partNumber,
    );
  }

  @Get('practice/stats')
  getPracticeStats(
    @Req() request: AuthRequest,
    @Query() query: GetPracticeStatsDto,
  ) {
    return this.practiceService.getPracticeStats(
      request.user.id,
      query.testId,
      query.partNumber,
    );
  }

  @Post('practice/sessions/:sessionId/answers')
  submitAnswer(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: SubmitPracticeAnswerDto,
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

  @Post('attempts')
  createAttempt(@Req() request: AuthRequest, @Body() dto: CreateAttemptDto) {
    return this.attemptService.createAttempt(request.user.id, dto);
  }

  @Get('attempts')
  listAttempts(@Req() request: AuthRequest, @Query() query: ListAttemptsDto) {
    return this.attemptService.listAttempts(
      request.user.id,
      query.testId,
      query.limit,
      query.offset,
    );
  }

  @Get('attempts/:attemptId')
  getAttempt(
    @Req() request: AuthRequest,
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
  ) {
    return this.attemptService.getAttempt(request.user.id, attemptId);
  }

  @Patch('attempts/:attemptId/parts/:partNumber/complete')
  completeAttemptPart(
    @Req() request: AuthRequest,
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Param('partNumber', ParseIntPipe) partNumber: number,
    @Body() dto: CompleteAttemptPartDto,
  ) {
    return this.attemptService.completeAttemptPart(
      request.user.id,
      attemptId,
      partNumber,
      dto,
    );
  }

  @Patch('attempts/:attemptId/complete')
  completeAttempt(
    @Req() request: AuthRequest,
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
  ) {
    return this.attemptService.completeAttempt(request.user.id, attemptId);
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
