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
          this.partPracticeRepository.countAnswersByStatus(
            run.id,
            ToeicRunQuestionStatus.RIGHT,
          ),
          this.partPracticeRepository.countAnswersByStatus(
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

    const run = await this.partPracticeMaterializer.findOrCreateRun(
      userId,
      partNumber,
    );

    return this.formatSession(run, mode);
  }

  async getRun(
    userId: string,
    sessionId: string,
    dto: GetPartPracticeRunDto = {},
  ): Promise<ToeicPartPracticeSessionResponse> {
    const run = await this.partPracticeRepository.findOwnedRunMeta(
      userId,
      sessionId,
    );

    if (!run) {
      throw new NotFoundException('Part practice session not found.');
    }

    return this.formatSession(run, dto.mode);
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

  private async assertPartExistsInCatalog(partNumber: number): Promise<void> {
    const total =
      await this.partPracticeRepository.countCatalogQuestionsByPart(partNumber);

    if (total === 0) {
      throw new NotFoundException('Test part not found.');
    }
  }

  private formatSession(
    run: PartPracticeRunForResponse,
    mode?: 'practice' | 'review_wrong',
  ): Promise<ToeicPartPracticeSessionResponse> {
    return this.partPracticeSessionMapper.formatSessionResponse(run, { mode });
  }
}
