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
import { CreateToeicRunDto } from './dto/create-toeic-run.dto';
import { ExpandToeicRunPartsDto } from './dto/expand-toeic-run-parts.dto';
import { GetToeicRunDto } from './dto/get-toeic-run.dto';
import { ListTestsDto } from './dto/list-tests.dto';
import { RefreshMediaDto } from './dto/refresh-media.dto';
import { SubmitToeicAnswerDto } from './dto/submit-toeic-answer.dto';
import { ToeicRunService } from './toeic-run.service';
import { TestsService } from './tests.service';

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
    private readonly toeicRunService: ToeicRunService,
  ) {}

  @Get()
  list(@Req() request: AuthRequest, @Query() query: ListTestsDto) {
    return this.testsService.listTests(request.user.id, query.year);
  }

  @Post('runs')
  createRun(@Req() request: AuthRequest, @Body() dto: CreateToeicRunDto) {
    return this.toeicRunService.createRun(request.user.id, dto);
  }

  @Get('runs/:sessionId')
  getRun(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Query() query: GetToeicRunDto,
  ) {
    return this.toeicRunService.getRun(request.user.id, sessionId, query);
  }

  @Post('runs/:sessionId/expand-parts')
  expandRunParts(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: ExpandToeicRunPartsDto,
  ) {
    return this.toeicRunService.expandRunParts(
      request.user.id,
      sessionId,
      dto,
    );
  }

  @Post('runs/:sessionId/answers')
  submitRunAnswer(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: SubmitToeicAnswerDto,
  ) {
    return this.toeicRunService.submitAnswer(request.user.id, sessionId, dto);
  }

  @Patch('runs/:sessionId/finish')
  finishRun(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ) {
    return this.toeicRunService.finishRun(request.user.id, sessionId);
  }

  @Delete(':testId/practice-history')
  clearPracticeHistory(
    @Req() request: AuthRequest,
    @Param('testId', ParseIntPipe) testId: number,
  ) {
    return this.toeicRunService.clearTestHistory(request.user.id, testId);
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
