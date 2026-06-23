import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ToeicRunMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExpandToeicRunPartsDto } from './dto/expand-toeic-run-parts.dto';
import { SubmitToeicAnswerDto } from './dto/submit-toeic-answer.dto';
import { CreateToeicRunDto } from './dto/create-toeic-run.dto';
import { GetToeicRunDto } from './dto/get-toeic-run.dto';
import { ToeicRunGrader } from './lib/toeic-run/grader';
import { isWrongReviewToeicGroup } from './lib/toeic-run/session.formatters';
import { ToeicRunMaterializer } from './lib/toeic-run/materializer';
import { ToeicRunSessionMapper } from './lib/toeic-run/session.mapper';
import type { ToeicSessionResponse } from './lib/toeic-run/session.response.types';

@Injectable()
export class ToeicRunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionMapper: ToeicRunSessionMapper,
    private readonly runMaterializer: ToeicRunMaterializer,
    private readonly runGrader: ToeicRunGrader,
  ) {}

  async createRun(
    userId: string,
    dto: CreateToeicRunDto,
  ): Promise<ToeicSessionResponse> {
    const selectedParts = this.resolveSelectedParts(dto);
    const mode = dto.mode ?? 'practice';

    await this.assertTestAndPartsExist(dto.testId, selectedParts);

    if (mode === 'mock_test') {
      const run = await this.runMaterializer.createRunWithQuestions({
        userId,
        testId: dto.testId,
        mode: ToeicRunMode.MOCK_TEST,
        selectedParts,
      });

      return this.sessionMapper.formatSessionResponse(run, selectedParts);
    }

    if (mode === 'review_wrong') {
      return this.createReviewWrongSession(userId, dto.testId, selectedParts);
    }

    const existingRun = await this.runMaterializer.findLatestPracticeRun(
      userId,
      dto.testId,
    );

    if (existingRun) {
      await this.runMaterializer.ensurePracticeRunIncludesParts(
        existingRun.id,
        dto.testId,
        selectedParts,
      );

      const refreshedRun = await this.runMaterializer.findRunForResponse(
        existingRun.id,
      );
      if (!refreshedRun) {
        throw new NotFoundException('Practice session not found.');
      }

      return this.sessionMapper.formatSessionResponse(refreshedRun, selectedParts);
    }

    const run = await this.runMaterializer.createRunWithQuestions({
      userId,
      testId: dto.testId,
      mode: ToeicRunMode.PRACTICE,
      selectedParts,
    });

    return this.sessionMapper.formatSessionResponse(run, selectedParts);
  }

  private resolveSelectedPartsFromNumbers(partNumbers: number[]): number[] {
    const selectedParts = [...new Set(partNumbers)].sort((a, b) => a - b);

    if (selectedParts.length === 0) {
      throw new BadRequestException('Select at least one test part.');
    }

    return selectedParts;
  }

  private resolveSelectedParts(dto: CreateToeicRunDto): number[] {
    return this.resolveSelectedPartsFromNumbers(dto.partNumbers);
  }

  private parsePartsQuery(parts: string): number[] {
    const parsed = parts
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);

    return this.resolveSelectedPartsFromNumbers(parsed);
  }

  private async assertTestAndPartsExist(
    testId: number,
    selectedParts: number[],
  ) {
    const test = await this.prisma.toeicTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    const parts = await this.prisma.toeicTestPart.findMany({
      where: {
        testId,
        partNumber: { in: selectedParts },
      },
      select: { partNumber: true },
    });
    const foundParts = new Set(parts.map((part) => part.partNumber));
    const missingPart = selectedParts.find((part) => !foundParts.has(part));

    if (missingPart !== undefined) {
      throw new NotFoundException('Test part not found.');
    }
  }

  private async createReviewWrongSession(
    userId: string,
    testId: number,
    selectedParts: number[],
  ) {
    const existingRun = await this.runMaterializer.findLatestPracticeRun(
      userId,
      testId,
    );

    if (!existingRun) {
      const run = await this.runMaterializer.createRunWithQuestions({
        userId,
        testId,
        mode: ToeicRunMode.PRACTICE,
        selectedParts,
      });

      return this.sessionMapper.formatSessionResponse(run, selectedParts, {
        mode: 'review_wrong',
        groupFilter: (group) => isWrongReviewToeicGroup(group),
      });
    }

    await this.runMaterializer.ensurePracticeRunIncludesParts(
      existingRun.id,
      testId,
      selectedParts,
    );

    const refreshedRun = await this.runMaterializer.findRunForResponse(
      existingRun.id,
    );
    if (!refreshedRun) {
      throw new NotFoundException('Practice session not found.');
    }

    return this.sessionMapper.formatSessionResponse(refreshedRun, selectedParts, {
      mode: 'review_wrong',
      groupFilter: (group) => isWrongReviewToeicGroup(group),
    });
  }

  async getRun(
    userId: string,
    sessionId: string,
    dto: GetToeicRunDto = {},
  ): Promise<ToeicSessionResponse> {
    const loadedRun = await this.prisma.toeicRun.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        mode: true,
        toeicTestId: true,
        selectedParts: true,
      },
    });

    if (!loadedRun) {
      throw new NotFoundException('TOEIC run not found.');
    }

    const visibleParts = dto.parts
      ? this.parsePartsQuery(dto.parts)
      : [...loadedRun.selectedParts];

    if (loadedRun.mode === ToeicRunMode.MOCK_TEST) {
      if (dto.mode === 'review_wrong') {
        throw new BadRequestException(
          'Review wrong is not supported for mock test runs.',
        );
      }

      await this.assertTestAndPartsExist(loadedRun.toeicTestId, visibleParts);

      const run = await this.runMaterializer.findRunForResponse(loadedRun.id);
      if (!run) {
        throw new NotFoundException('TOEIC run not found.');
      }

      return this.sessionMapper.formatSessionResponse(run, visibleParts);
    }

    await this.assertTestAndPartsExist(loadedRun.toeicTestId, visibleParts);

    const run = await this.runMaterializer.findRunForResponse(loadedRun.id);
    if (!run) {
      throw new NotFoundException('Practice session not found.');
    }

    if (dto.mode === 'review_wrong') {
      return this.sessionMapper.formatSessionResponse(run, visibleParts, {
        mode: 'review_wrong',
        groupFilter: (group) => isWrongReviewToeicGroup(group),
      });
    }

    return this.sessionMapper.formatSessionResponse(run, visibleParts);
  }

  async expandRunParts(
    userId: string,
    sessionId: string,
    dto: ExpandToeicRunPartsDto,
  ): Promise<ToeicSessionResponse> {
    const selectedParts = this.resolveSelectedPartsFromNumbers(dto.partNumbers);
    const loadedRun = await this.prisma.toeicRun.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        mode: true,
        toeicTestId: true,
      },
    });

    if (!loadedRun) {
      throw new NotFoundException('TOEIC run not found.');
    }

    if (loadedRun.mode === ToeicRunMode.MOCK_TEST) {
      throw new BadRequestException(
        'Only practice runs can be expanded with additional parts.',
      );
    }

    await this.assertTestAndPartsExist(loadedRun.toeicTestId, selectedParts);
    await this.runMaterializer.ensurePracticeRunIncludesParts(
      loadedRun.id,
      loadedRun.toeicTestId,
      selectedParts,
    );

    const run = await this.runMaterializer.findRunForResponse(loadedRun.id);
    if (!run) {
      throw new NotFoundException('Practice session not found.');
    }

    return this.sessionMapper.formatSessionResponse(run, selectedParts);
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitToeicAnswerDto,
  ) {
    return this.runGrader.submitAnswer(userId, sessionId, dto);
  }

  async finishRun(
    userId: string,
    sessionId: string,
  ): Promise<ToeicSessionResponse> {
    const run = await this.prisma.toeicRun.findFirst({
      where: { id: sessionId, userId },
    });

    if (!run) {
      throw new NotFoundException('TOEIC run not found.');
    }

    if (run.mode !== ToeicRunMode.MOCK_TEST) {
      throw new BadRequestException('Only mock test runs can be finished.');
    }

    if (!run.completedAt) {
      await this.runGrader.completeMockRun(run.id);
    }

    const finishedRun = await this.runMaterializer.findRunForResponse(run.id);
    if (!finishedRun) {
      throw new NotFoundException('TOEIC run not found.');
    }

    return this.sessionMapper.formatSessionResponse(finishedRun);
  }

  async clearTestHistory(userId: string, testId: number) {
    const test = await this.prisma.toeicTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    const [runResult] = await this.prisma.$transaction([
      this.prisma.toeicRun.deleteMany({
        where: {
          userId,
          toeicTestId: testId,
        },
      }),
    ]);

    return { deletedSessionCount: runResult.count };
  }
}
