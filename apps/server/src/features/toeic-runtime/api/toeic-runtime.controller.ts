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
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import type { AuthRequest } from '../../../auth/types/auth.types';
import { CreateToeicRuntimePartPracticeRunDto } from './dto/create-part-practice-run.dto';
import { CreateToeicRuntimeTestRunDto } from './dto/create-test-run.dto';
import { SelectToeicRuntimeMockRunDto } from './dto/select-mock-run.dto';
import { SubmitToeicRuntimeAnswerDto } from './dto/submit-answer.dto';
import { UpdateMockTimerDto } from './dto/update-mock-timer.dto';
import { ToeicRuntimeService } from '../model/toeic-runtime.service';

@Controller('tests/runtime')
@UseGuards(JwtAuthGuard)
export class ToeicRuntimeController {
  constructor(private readonly runtimeService: ToeicRuntimeService) {}

  @Post('test-runs')
  createTestRun(
    @Req() request: AuthRequest,
    @Body() dto: CreateToeicRuntimeTestRunDto,
  ) {
    return this.runtimeService.createTestRun(request.user.id, dto);
  }

  @Post('part-practice-runs')
  createPartPracticeRun(
    @Req() request: AuthRequest,
    @Body() dto: CreateToeicRuntimePartPracticeRunDto,
  ) {
    return this.runtimeService.createPartPracticeRun(request.user.id, dto);
  }

  @Post('mock-runs/prepare')
  prepareMockRun(
    @Req() request: AuthRequest,
    @Body() dto: SelectToeicRuntimeMockRunDto,
  ) {
    return this.runtimeService.prepareMockRun(request.user.id, dto);
  }

  @Post('mock-runs/restart')
  restartMockRun(
    @Req() request: AuthRequest,
    @Body() dto: SelectToeicRuntimeMockRunDto,
  ) {
    return this.runtimeService.restartMockRun(request.user.id, dto);
  }

  @Get('test-practice-runs')
  listTestPracticeRuns(@Req() request: AuthRequest) {
    return this.runtimeService.listTestPracticeRuns(request.user.id);
  }

  @Get('mock-runs/:testKey')
  listMockRuns(@Req() request: AuthRequest, @Param('testKey') testKey: string) {
    return this.runtimeService.listMockRuns(request.user.id, testKey);
  }

  @Delete('test-practice-runs/:testKey')
  clearTestPracticeRun(
    @Req() request: AuthRequest,
    @Param('testKey') testKey: string,
  ) {
    return this.runtimeService.clearTestPracticeRun(request.user.id, testKey);
  }

  @Get('part-practice-runs')
  listPartPracticeRuns(@Req() request: AuthRequest) {
    return this.runtimeService.listPartPracticeRuns(request.user.id);
  }

  @Delete('part-practice-runs/:partNumber')
  clearPartPracticeRun(
    @Req() request: AuthRequest,
    @Param('partNumber', ParseIntPipe) partNumber: number,
  ) {
    return this.runtimeService.clearPartPracticeRun(
      request.user.id,
      partNumber,
    );
  }

  @Get('runs/:sessionId')
  getRun(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ) {
    return this.runtimeService.getRun(request.user.id, sessionId);
  }

  @Post('runs/:sessionId/answers')
  submitAnswer(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: SubmitToeicRuntimeAnswerDto,
  ) {
    return this.runtimeService.submitAnswer(request.user.id, sessionId, dto);
  }

  @Patch('runs/:sessionId/finish')
  async finishMockRun(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.runtimeService.finishMockRun(
      request.user.id,
      sessionId,
    );
    response.status(
      result.status === 'accepted' ? HttpStatus.ACCEPTED : HttpStatus.OK,
    );
    return result;
  }

  @Patch('runs/:sessionId/timer')
  updateMockTimer(
    @Req() request: AuthRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: UpdateMockTimerDto,
  ) {
    return this.runtimeService.updateMockTimer(request.user.id, sessionId, dto);
  }
}
