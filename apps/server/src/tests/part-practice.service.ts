import { Injectable, NotFoundException } from '@nestjs/common';
import { ToeicRunQuestionStatus } from '@prisma/client';
import { CreatePartPracticeRunDto } from './dto/create-part-practice-run.dto';
import { GetPartPracticeRunDto } from './dto/get-part-practice-run.dto';
import { SubmitPartPracticeAnswerDto } from './dto/submit-part-practice-answer.dto';
import { ToeicPartPracticeGrader } from './lib/toeic-part-practice/grader';
import { ToeicPartPracticeMaterializer } from './lib/toeic-part-practice/materializer';
import { ToeicPartPracticeRepository } from './lib/toeic-part-practice/repository';
import { ToeicPartPracticeSessionMapper } from './lib/toeic-part-practice/session.mapper';
import type {
  ClearPartPracticeHistoryResponse,
  ListPartPracticeSummaryResponse,
  ToeicPartPracticeSessionResponse,
} from './lib/toeic-part-practice/session.response.types';
import type { PartPracticeRunForResponse } from './lib/toeic-part-practice/session.types';
import { isWrongReviewToeicGroup } from './lib/toeic-run/session.formatters';

@Injectable()
export class PartPracticeService {
  constructor(
    private readonly partPracticeRepository: ToeicPartPracticeRepository,
    private readonly partPracticeMaterializer: ToeicPartPracticeMaterializer,
    private readonly partPracticeSessionMapper: ToeicPartPracticeSessionMapper,
    private readonly partPracticeGrader: ToeicPartPracticeGrader,
  ) {}

  async listPartSummaries(
    userId: string,
  ): Promise<ListPartPracticeSummaryResponse> {
    const partNumbers =
      await this.partPracticeRepository.listCatalogPartNumbers();

    const items = await Promise.all(
      partNumbers.map(async (partNumber) => {
        const total =
          await this.partPracticeRepository.countCatalogQuestionsByPart(
            partNumber,
          );
        const run = await this.partPracticeRepository.findRunByUserAndPart(
          userId,
          partNumber,
        );

        if (!run) {
          return {
            partNumber,
            total,
            answered: 0,
            correct: 0,
            wrong: 0,
          };
        }

        const [correct, wrong] = await Promise.all([
          this.partPracticeRepository.countRunQuestionsByStatus(
            run.id,
            ToeicRunQuestionStatus.RIGHT,
          ),
          this.partPracticeRepository.countRunQuestionsByStatus(
            run.id,
            ToeicRunQuestionStatus.WRONG,
          ),
        ]);

        return {
          partNumber,
          total,
          answered: correct + wrong,
          correct,
          wrong,
        };
      }),
    );

    return { items };
  }

  async createRun(
    userId: string,
    dto: CreatePartPracticeRunDto,
  ): Promise<ToeicPartPracticeSessionResponse> {
    const partNumber = dto.partNumber;
    const mode = dto.mode ?? 'practice';

    await this.assertPartExistsInCatalog(partNumber);

    if (mode === 'review_wrong') {
      return this.createReviewWrongSession(userId, partNumber);
    }

    const run =
      await this.partPracticeMaterializer.findOrCreateRunWithQuestions(
        userId,
        partNumber,
      );

    return this.formatSession(run);
  }

  async getRun(
    userId: string,
    sessionId: string,
    dto: GetPartPracticeRunDto = {},
  ): Promise<ToeicPartPracticeSessionResponse> {
    const loadedRun = await this.partPracticeRepository.findOwnedRunMeta(
      userId,
      sessionId,
    );

    if (!loadedRun) {
      throw new NotFoundException('Part practice session not found.');
    }

    const run = await this.partPracticeMaterializer.findRunForResponse(
      loadedRun.id,
    );
    if (!run) {
      throw new NotFoundException('Part practice session not found.');
    }

    if (dto.mode === 'review_wrong') {
      return this.formatSession(run, {
        mode: 'review_wrong',
        groupFilter: (group) => isWrongReviewToeicGroup(group),
      });
    }

    return this.formatSession(run);
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitPartPracticeAnswerDto,
  ) {
    return this.partPracticeGrader.submitAnswer(userId, sessionId, dto);
  }

  async clearPartHistory(
    userId: string,
    partNumber: number,
  ): Promise<ClearPartPracticeHistoryResponse> {
    await this.assertPartExistsInCatalog(partNumber);

    const resetRunCount =
      await this.partPracticeRepository.resetPartPracticeAnswers(
        userId,
        partNumber,
      );

    return { resetRunCount };
  }

  private async createReviewWrongSession(
    userId: string,
    partNumber: number,
  ): Promise<ToeicPartPracticeSessionResponse> {
    const run =
      await this.partPracticeMaterializer.findOrCreateRunWithQuestions(
        userId,
        partNumber,
      );

    return this.formatSession(run, {
      mode: 'review_wrong',
      groupFilter: (group) => isWrongReviewToeicGroup(group),
    });
  }

  private async assertPartExistsInCatalog(partNumber: number): Promise<void> {
    const total =
      await this.partPracticeRepository.countCatalogQuestionsByPart(partNumber);

    if (total === 0) {
      throw new NotFoundException('Test part not found.');
    }
  }

  private formatSession(
    run: PartPracticeRunForResponse,
    options?: {
      mode?: 'practice' | 'review_wrong';
      groupFilter?: (
        group: PartPracticeRunForResponse['groups'][number],
      ) => boolean;
    },
  ): Promise<ToeicPartPracticeSessionResponse> {
    return this.partPracticeSessionMapper.formatSessionResponse(run, options);
  }
}
