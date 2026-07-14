import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { CreateToeicRunDto } from './dto/create-toeic-run.dto';
import { CreatePartPracticeRunDto } from './dto/create-part-practice-run.dto';
import { ExpandToeicRunPartsDto } from './dto/expand-toeic-run-parts.dto';
import { GetPartPracticeRunDto } from './dto/get-part-practice-run.dto';
import { GetToeicRunDto } from './dto/get-toeic-run.dto';
import { ListTestsDto } from './dto/list-tests.dto';
import { RefreshMediaDto } from './dto/refresh-media.dto';
import { SubmitPartPracticeAnswerDto } from './dto/submit-part-practice-answer.dto';
import { SubmitToeicAnswerDto } from './dto/submit-toeic-answer.dto';
import { PartPracticeService } from './part-practice.service';
import { ToeicRunService } from './toeic-run.service';
import { TestsService } from './tests.service';

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
    private readonly toeicRunService: ToeicRunService,
    private readonly partPracticeService: PartPracticeService,
  ) {}

  @Get('years')
  listYears() {
    return this.testsService.listAvailableYears();
  }

  @Get()
  list(@Req() request: AuthRequest, @Query() query: ListTestsDto) {
    return this.testsService.listTests(request.user.id, query.year);
  }

  @Get('part-practice/parts')
  listPartPracticeSummaries(@Req() request: AuthRequest) {
    return this.partPracticeService.listPartSummaries(request.user.id);
  }

  @Post('part-practice/runs')
  createPartPracticeRun(
    @Req() request: AuthRequest,
    @Body() dto: CreatePartPracticeRunDto,
  ) {
    return this.partPracticeService.createRun(request.user.id, dto);
  }

  @Get('part-practice/runs/:sessionId')
  getPartPracticeRun(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Query() query: GetPartPracticeRunDto,
  ) {
    return this.partPracticeService.getRun(request.user.id, sessionId, query);
  }

  @Post('part-practice/runs/:sessionId/answers')
  submitPartPracticeAnswer(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: SubmitPartPracticeAnswerDto,
  ) {
    return this.partPracticeService.submitAnswer(
      request.user.id,
      sessionId,
      dto,
    );
  }

  @Delete('part-practice/:partNumber/history')
  clearPartPracticeHistory(
    @Req() request: AuthRequest,
    @Param('partNumber', ParseIntPipe) partNumber: number,
  ) {
    return this.partPracticeService.clearPartHistory(
      request.user.id,
      partNumber,
    );
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
    return this.toeicRunService.expandRunParts(request.user.id, sessionId, dto);
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
  async finishRun(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.toeicRunService.finishRun(
      request.user.id,
      sessionId,
    );

    response.status(
      result.status === 'accepted' ? HttpStatus.ACCEPTED : HttpStatus.OK,
    );
    return result;
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
