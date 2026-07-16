import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ToeicRunMode } from '@prisma/client';
import { ExpandToeicRunPartsDto } from './dto/expand-toeic-run-parts.dto';
import { SubmitToeicAnswerDto } from './dto/submit-toeic-answer.dto';
import { CreateToeicRunDto } from './dto/create-toeic-run.dto';
import { GetToeicRunDto } from './dto/get-toeic-run.dto';
import { ToeicRunGrader } from './lib/toeic-run/grader';
import { ToeicRunMaterializer } from './lib/toeic-run/materializer';
import { ToeicRunRepository } from './lib/toeic-run/repository';
import { ToeicRunSessionMapper } from './lib/toeic-run/session.mapper';
import type { FormatToeicSessionResponseOptions } from './lib/toeic-run/session.types';
import type { ToeicSessionResponse } from './lib/toeic-run/session.response.types';
import type { ToeicRunForResponse } from './lib/toeic-run/session.types';

@Injectable()
export class ToeicRunService {
  private readonly logger = new Logger(ToeicRunService.name);
  private readonly activeMockRunCompletions = new Set<string>();

  constructor(
    private readonly runRepository: ToeicRunRepository,
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

    await this.runRepository.assertTestAndPartsExist(dto.testId, selectedParts);

    if (mode === 'mock_test') {
      const run = await this.runMaterializer.createRun({
        userId,
        testId: dto.testId,
        mode: ToeicRunMode.MOCK_TEST,
        selectedParts,
      });

      return this.formatSession(run, selectedParts);
    }

    if (mode === 'review_wrong') {
      return this.createReviewWrongSession(userId, dto.testId, selectedParts);
    }

    const run = await this.runMaterializer.findOrCreatePracticeRun({
      userId,
      testId: dto.testId,
      selectedParts,
    });

    return this.formatSession(run, selectedParts);
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

  private async formatSession(
    run: ToeicRunForResponse,
    visibleParts: number[] = run.selectedParts,
    options?: Omit<FormatToeicSessionResponseOptions, 'year'>,
  ): Promise<ToeicSessionResponse> {
    const year = await this.runRepository.getTestYear(run.toeicTestId);

    return this.sessionMapper.formatSessionResponse(run, visibleParts, {
      ...options,
      year,
    });
  }

  private async createReviewWrongSession(
    userId: string,
    testId: number,
    selectedParts: number[],
  ) {
    const run = await this.runMaterializer.findOrCreatePracticeRun({
      userId,
      testId,
      selectedParts,
    });

    return this.formatSession(run, selectedParts, {
      mode: 'review_wrong',
    });
  }

  async getRun(
    userId: string,
    sessionId: string,
    dto: GetToeicRunDto = {},
  ): Promise<ToeicSessionResponse> {
    const loadedRun = await this.runRepository.findOwnedRunMeta(
      userId,
      sessionId,
    );

    if (!loadedRun) {
      throw new NotFoundException('TOEIC run not found.');
    }

    const visibleParts = dto.parts
      ? this.parsePartsQuery(dto.parts)
      : [...loadedRun.selectedParts];

    if (
      visibleParts.some(
        (partNumber) => !loadedRun.selectedParts.includes(partNumber),
      )
    ) {
      throw new BadRequestException('Requested part is not in this session.');
    }

    if (loadedRun.mode === ToeicRunMode.MOCK_TEST) {
      if (dto.mode === 'review_wrong') {
        throw new BadRequestException(
          'Review wrong is not supported for mock test runs.',
        );
      }

      await this.runRepository.assertTestAndPartsExist(
        loadedRun.toeicTestId,
        visibleParts,
      );

      return this.formatSession(loadedRun, visibleParts);
    }

    await this.runRepository.assertTestAndPartsExist(
      loadedRun.toeicTestId,
      visibleParts,
    );

    if (dto.mode === 'review_wrong') {
      return this.formatSession(loadedRun, visibleParts, {
        mode: 'review_wrong',
      });
    }

    return this.formatSession(loadedRun, visibleParts);
  }

  async expandRunParts(
    userId: string,
    sessionId: string,
    dto: ExpandToeicRunPartsDto,
  ): Promise<ToeicSessionResponse> {
    const selectedParts = this.resolveSelectedPartsFromNumbers(dto.partNumbers);
    const loadedRun = await this.runRepository.findOwnedRunMeta(
      userId,
      sessionId,
    );

    if (!loadedRun) {
      throw new NotFoundException('TOEIC run not found.');
    }

    if (loadedRun.mode === ToeicRunMode.MOCK_TEST) {
      throw new BadRequestException(
        'Only practice runs can be expanded with additional parts.',
      );
    }

    await this.runRepository.assertTestAndPartsExist(
      loadedRun.toeicTestId,
      selectedParts,
    );
    const run = await this.runMaterializer.findOrCreatePracticeRun({
      userId,
      testId: loadedRun.toeicTestId,
      selectedParts,
    });

    return this.formatSession(run, selectedParts);
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
  ): Promise<{ status: 'accepted' | 'completed' }> {
    const run = await this.runRepository.findOwnedRun(userId, sessionId);

    if (!run) {
      throw new NotFoundException('TOEIC run not found.');
    }

    if (run.mode !== ToeicRunMode.MOCK_TEST) {
      throw new BadRequestException('Only mock test runs can be finished.');
    }

    if (run.completedAt) {
      return { status: 'completed' };
    }

    this.scheduleMockRunCompletion(run.id);
    return { status: 'accepted' };
  }

  private scheduleMockRunCompletion(runId: string): void {
    if (this.activeMockRunCompletions.has(runId)) {
      return;
    }

    this.activeMockRunCompletions.add(runId);
    setImmediate(() => void this.completeMockRunInBackground(runId));
  }

  private async completeMockRunInBackground(runId: string): Promise<void> {
    try {
      await this.runGrader.completeMockRun(runId);
    } catch (error) {
      this.logger.error(
        `Failed to finish mock run ${runId}.`,
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.activeMockRunCompletions.delete(runId);
    }
  }

  async clearTestHistory(userId: string, testId: number) {
    const test = await this.runRepository.findTestById(testId);

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    const deletedSessionCount =
      await this.runRepository.resetPracticeRunAnswers(userId, testId);
    return { deletedSessionCount };
  }
}
