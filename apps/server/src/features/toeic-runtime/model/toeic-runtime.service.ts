import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ToeicLearningScope,
  ToeicRunMode,
  ToeicRunQuestionStatus,
} from '@prisma/client';
import {
  type CatalogQuestion,
  ToeicCatalogGradingIndex,
} from '../../../entities/toeic-catalog/lib/grading-index';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CreateToeicRuntimePartPracticeRunDto } from '../api/dto/create-part-practice-run.dto';
import type { CreateToeicRuntimeTestRunDto } from '../api/dto/create-test-run.dto';
import type { SubmitToeicRuntimeAnswerDto } from '../api/dto/submit-answer.dto';

type RuntimeRun = {
  id: string;
  scope: ToeicLearningScope;
  testKey: string | null;
  partNumber: number | null;
  mode: ToeicRunMode;
  selectedParts: number[];
  totalRight: number;
  totalWrong: number;
  finishRequestedAt: Date | null;
  completedAt: Date | null;
  answers: Array<{
    questionKey: string;
    selectedKey: string;
    status: ToeicRunQuestionStatus;
  }>;
};

const MOCK_FINISH_RETRY_DELAYS_MS = [1_000, 2_000, 5_000] as const;

function normalizeParts(parts: number[]): number[] {
  return [...new Set(parts)].sort((left, right) => left - right);
}

function formatRun(run: RuntimeRun) {
  return {
    sessionId: run.id,
    scope: run.scope === ToeicLearningScope.TEST ? 'test' : 'part_practice',
    testKey: run.testKey,
    partNumber: run.partNumber,
    mode: run.mode === ToeicRunMode.MOCK_TEST ? 'mock_test' : 'practice',
    selectedParts: run.selectedParts,
    correctCount: run.totalRight,
    wrongCount: run.totalWrong,
    finish: {
      status: run.completedAt
        ? 'completed'
        : run.finishRequestedAt
          ? 'pending'
          : 'open',
    },
    answers: run.answers.map((answer) => ({
      questionKey: answer.questionKey,
      selectedKey: answer.selectedKey,
      status: answer.status.toLowerCase(),
    })),
  };
}

@Injectable()
export class ToeicRuntimeService {
  private readonly logger = new Logger(ToeicRuntimeService.name);
  private readonly activeMockCompletions = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gradingIndex: ToeicCatalogGradingIndex,
  ) {}

  async createTestRun(userId: string, dto: CreateToeicRuntimeTestRunDto) {
    const selectedParts = normalizeParts(dto.partNumbers);

    if (!(await this.gradingIndex.hasTestParts(dto.testKey, selectedParts))) {
      throw new BadRequestException('Test or selected parts are unavailable.');
    }

    const mode =
      dto.mode === 'mock_test' ? ToeicRunMode.MOCK_TEST : ToeicRunMode.PRACTICE;
    const run =
      mode === ToeicRunMode.MOCK_TEST
        ? await this.prisma.toeicLearningRun.create({
            data: {
              userId,
              scope: ToeicLearningScope.TEST,
              testKey: dto.testKey,
              mode,
              selectedParts,
            },
            include: { answers: true },
          })
        : await this.findOrCreatePracticeTestRun(
            userId,
            dto.testKey,
            selectedParts,
          );

    return formatRun(run);
  }

  async createPartPracticeRun(
    userId: string,
    dto: CreateToeicRuntimePartPracticeRunDto,
  ) {
    if (!(await this.gradingIndex.hasPart(dto.partNumber))) {
      throw new BadRequestException('Part is unavailable.');
    }

    const run = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${`part:${dto.partNumber}`}))`,
      );
      const existing = await tx.toeicLearningRun.findFirst({
        where: {
          userId,
          scope: ToeicLearningScope.PART_PRACTICE,
          partNumber: dto.partNumber,
          mode: ToeicRunMode.PRACTICE,
        },
        include: { answers: true },
      });

      return (
        existing ??
        tx.toeicLearningRun.create({
          data: {
            userId,
            scope: ToeicLearningScope.PART_PRACTICE,
            partNumber: dto.partNumber,
            selectedParts: [dto.partNumber],
          },
          include: { answers: true },
        })
      );
    });

    return formatRun(run);
  }

  async listTestPracticeRuns(userId: string) {
    const runs = await this.prisma.toeicLearningRun.findMany({
      where: {
        userId,
        scope: ToeicLearningScope.TEST,
        mode: ToeicRunMode.PRACTICE,
      },
      include: { answers: { select: { questionKey: true, status: true } } },
    });

    const items = (
      await Promise.all(
        runs.map(async (run) => {
          if (!run.testKey) {
            return [];
          }

          const progressByPart = new Map<
            number,
            { correctCount: number; wrongCount: number }
          >();
          const questions = await Promise.all(
            run.answers.map(async (answer) => ({
              answer,
              question: await this.gradingIndex.getQuestion(answer.questionKey),
            })),
          );
          for (const { answer, question } of questions) {
            if (!question || question.testKey !== run.testKey) {
              continue;
            }

            const progress = progressByPart.get(question.partNumber) ?? {
              correctCount: 0,
              wrongCount: 0,
            };
            if (answer.status === ToeicRunQuestionStatus.RIGHT) {
              progress.correctCount += 1;
            } else if (answer.status === ToeicRunQuestionStatus.WRONG) {
              progress.wrongCount += 1;
            }
            progressByPart.set(question.partNumber, progress);
          }

          return [
            {
              testKey: run.testKey,
              answeredCount: run.answers.length,
              correctCount: run.totalRight,
              wrongCount: run.totalWrong,
              parts: [...progressByPart.entries()]
                .sort(([left], [right]) => left - right)
                .map(([partNumber, progress]) => ({
                  partNumber,
                  ...progress,
                })),
            },
          ];
        }),
      )
    ).flat();

    return { items };
  }

  async clearTestPracticeRun(userId: string, testKey: string) {
    const result = await this.prisma.toeicLearningRun.deleteMany({
      where: {
        userId,
        scope: ToeicLearningScope.TEST,
        testKey,
        mode: ToeicRunMode.PRACTICE,
      },
    });

    return { resetRunCount: result.count };
  }

  async listPartPracticeRuns(userId: string) {
    const runs = await this.prisma.toeicLearningRun.findMany({
      where: {
        userId,
        scope: ToeicLearningScope.PART_PRACTICE,
        mode: ToeicRunMode.PRACTICE,
      },
      include: { answers: { select: { status: true } } },
    });

    return {
      items: runs.map((run) => ({
        partNumber: run.partNumber,
        answeredCount: run.answers.length,
        correctCount: run.totalRight,
        wrongCount: run.totalWrong,
      })),
    };
  }

  async clearPartPracticeRun(userId: string, partNumber: number) {
    if (partNumber < 1 || partNumber > 7) {
      throw new BadRequestException('Part is unavailable.');
    }

    const result = await this.prisma.toeicLearningRun.deleteMany({
      where: {
        userId,
        scope: ToeicLearningScope.PART_PRACTICE,
        partNumber,
        mode: ToeicRunMode.PRACTICE,
      },
    });

    return { resetRunCount: result.count };
  }

  async getRun(userId: string, sessionId: string) {
    const initial = await this.findOwnedRun(userId, sessionId);
    if (
      initial.mode === ToeicRunMode.MOCK_TEST &&
      initial.finishRequestedAt &&
      !initial.completedAt
    ) {
      this.scheduleMockCompletion(initial.id);
      await this.completeMockRun(initial.id);
    }

    return formatRun(await this.findOwnedRun(userId, sessionId));
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitToeicRuntimeAnswerDto,
  ) {
    const run = await this.findOwnedRun(userId, sessionId);
    const question = await this.gradingIndex.getQuestion(dto.questionKey);

    if (!question || !this.questionBelongsToRun(question, run)) {
      throw new BadRequestException(
        'Question does not belong to this session.',
      );
    }
    if (run.completedAt || run.finishRequestedAt) {
      throw new BadRequestException('TOEIC run is not open for answers.');
    }

    if (run.mode === ToeicRunMode.MOCK_TEST) {
      await this.saveMockAnswer(run.id, dto.questionKey, dto.selectedKey);
      return { graded: false };
    }

    return this.savePracticeAnswer(
      run,
      question,
      dto.questionKey,
      dto.selectedKey,
      dto.mode === 'review_wrong',
    );
  }

  async finishMockRun(userId: string, sessionId: string) {
    const run = await this.findOwnedRun(userId, sessionId);
    if (
      run.scope !== ToeicLearningScope.TEST ||
      run.mode !== ToeicRunMode.MOCK_TEST
    ) {
      throw new BadRequestException('Only mock test runs can be finished.');
    }
    if (run.completedAt) {
      return { status: 'completed' as const };
    }

    if (!run.finishRequestedAt) {
      await this.prisma.toeicLearningRun.update({
        where: { id: run.id },
        data: { finishRequestedAt: new Date() },
      });
    }
    this.scheduleMockCompletion(run.id);
    return { status: 'accepted' as const };
  }

  private async findOrCreatePracticeTestRun(
    userId: string,
    testKey: string,
    selectedParts: number[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${`test:${testKey}`}))`,
      );
      const existing = await tx.toeicLearningRun.findFirst({
        where: {
          userId,
          scope: ToeicLearningScope.TEST,
          testKey,
          mode: ToeicRunMode.PRACTICE,
        },
        include: { answers: true },
      });

      if (!existing) {
        return tx.toeicLearningRun.create({
          data: {
            userId,
            scope: ToeicLearningScope.TEST,
            testKey,
            selectedParts,
          },
          include: { answers: true },
        });
      }

      const nextParts = normalizeParts([
        ...existing.selectedParts,
        ...selectedParts,
      ]);
      if (nextParts.join(',') === existing.selectedParts.join(',')) {
        return existing;
      }

      return tx.toeicLearningRun.update({
        where: { id: existing.id },
        data: { selectedParts: nextParts },
        include: { answers: true },
      });
    });
  }

  private findOwnedRun(userId: string, sessionId: string): Promise<RuntimeRun> {
    return this.prisma.toeicLearningRun
      .findFirst({
        where: { id: sessionId, userId },
        include: { answers: { orderBy: { answeredAt: 'asc' } } },
      })
      .then((run) => {
        if (!run) {
          throw new NotFoundException('TOEIC session not found.');
        }
        return run;
      });
  }

  private questionBelongsToRun(
    question: { testKey: string; partNumber: number },
    run: RuntimeRun,
  ): boolean {
    return run.scope === ToeicLearningScope.TEST
      ? run.testKey === question.testKey &&
          run.selectedParts.includes(question.partNumber)
      : run.partNumber === question.partNumber;
  }

  private async saveMockAnswer(
    runId: string,
    questionKey: string,
    selectedKey: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.lockOpenRun(tx, runId);
      await tx.toeicLearningRunAnswer.upsert({
        where: { runId_questionKey: { runId, questionKey } },
        create: {
          runId,
          questionKey,
          selectedKey,
          status: ToeicRunQuestionStatus.SELECTED,
          answeredAt: new Date(),
        },
        update: {
          selectedKey,
          status: ToeicRunQuestionStatus.SELECTED,
          answeredAt: new Date(),
          gradedAt: null,
        },
      });
    });
  }

  private async savePracticeAnswer(
    run: RuntimeRun,
    question: CatalogQuestion,
    questionKey: string,
    selectedKey: string,
    reviewWrong: boolean,
  ) {
    const groupQuestions = await this.gradingIndex.getGroupQuestions(
      question.testKey,
      question.partNumber,
      question.groupKey,
    );
    let graded = false;
    await this.prisma.$transaction(async (tx) => {
      await this.lockOpenRun(tx, run.id);
      const existing = await tx.toeicLearningRunAnswer.findUnique({
        where: { runId_questionKey: { runId: run.id, questionKey } },
      });

      if (existing?.status === ToeicRunQuestionStatus.RIGHT) {
        if (existing.selectedKey !== selectedKey) {
          throw new BadRequestException('Graded answers cannot be changed.');
        }
        return;
      }
      if (existing?.status === ToeicRunQuestionStatus.WRONG && !reviewWrong) {
        if (existing.selectedKey !== selectedKey) {
          throw new BadRequestException('Graded answers cannot be changed.');
        }
        return;
      }

      await tx.toeicLearningRunAnswer.upsert({
        where: { runId_questionKey: { runId: run.id, questionKey } },
        create: {
          runId: run.id,
          questionKey,
          selectedKey,
          status: ToeicRunQuestionStatus.SELECTED,
          answeredAt: new Date(),
        },
        update: {
          selectedKey,
          status: ToeicRunQuestionStatus.SELECTED,
          answeredAt: new Date(),
          gradedAt: null,
        },
      });

      const answers = await tx.toeicLearningRunAnswer.findMany({
        where: {
          runId: run.id,
          questionKey: { in: groupQuestions.map((item) => item.questionKey) },
        },
      });
      const answerByKey = new Map(
        answers.map((answer) => [answer.questionKey, answer]),
      );
      const ready = groupQuestions.every((item) => {
        const answer = answerByKey.get(item.questionKey);
        return (
          answer?.status === ToeicRunQuestionStatus.RIGHT ||
          Boolean(answer?.selectedKey)
        );
      });

      if (!ready) {
        return;
      }

      graded = true;
      await Promise.all(
        groupQuestions.map((item) => {
          const answer = answerByKey.get(item.questionKey);
          if (!answer || answer.status === ToeicRunQuestionStatus.RIGHT) {
            return Promise.resolve();
          }
          return tx.toeicLearningRunAnswer.update({
            where: { id: answer.id },
            data: {
              status:
                answer.selectedKey === item.answerKey
                  ? ToeicRunQuestionStatus.RIGHT
                  : ToeicRunQuestionStatus.WRONG,
              gradedAt: new Date(),
            },
          });
        }),
      );
      await this.recalculateTotals(tx, run.id);
    });

    return { graded };
  }

  private async lockOpenRun(tx: Prisma.TransactionClient, runId: string) {
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
        finishRequestedAt: Date | null;
        completedAt: Date | null;
      }>
    >(
      Prisma.sql`SELECT "id", "finish_requested_at" AS "finishRequestedAt", "completed_at" AS "completedAt" FROM "toeic_learning_runs" WHERE "id" = ${runId} FOR UPDATE`,
    );
    const run = rows[0];
    if (!run) {
      throw new NotFoundException('TOEIC session not found.');
    }
    if (run.completedAt || run.finishRequestedAt) {
      throw new BadRequestException('TOEIC run is not open for answers.');
    }
  }

  private async recalculateTotals(tx: Prisma.TransactionClient, runId: string) {
    const [totalRight, totalWrong] = await Promise.all([
      tx.toeicLearningRunAnswer.count({
        where: { runId, status: ToeicRunQuestionStatus.RIGHT },
      }),
      tx.toeicLearningRunAnswer.count({
        where: { runId, status: ToeicRunQuestionStatus.WRONG },
      }),
    ]);
    await tx.toeicLearningRun.update({
      where: { id: runId },
      data: { totalRight, totalWrong },
    });
  }

  private scheduleMockCompletion(runId: string): void {
    if (this.activeMockCompletions.has(runId)) {
      return;
    }
    this.activeMockCompletions.add(runId);
    setImmediate(() => void this.runMockCompletion(runId));
  }

  private async runMockCompletion(
    runId: string,
    retryIndex = 0,
  ): Promise<void> {
    const completed = await this.completeMockRun(runId);

    if (completed) {
      this.activeMockCompletions.delete(runId);
      return;
    }

    const delay =
      MOCK_FINISH_RETRY_DELAYS_MS[
        Math.min(retryIndex, MOCK_FINISH_RETRY_DELAYS_MS.length - 1)
      ];
    setTimeout(() => {
      void this.runMockCompletion(runId, retryIndex + 1);
    }, delay);
  }

  private async completeMockRun(runId: string): Promise<boolean> {
    try {
      const pendingRun = await this.prisma.toeicLearningRun.findUnique({
        where: { id: runId },
        select: {
          testKey: true,
          selectedParts: true,
          finishRequestedAt: true,
          completedAt: true,
        },
      });
      if (
        !pendingRun ||
        pendingRun.completedAt ||
        !pendingRun.finishRequestedAt ||
        !pendingRun.testKey
      ) {
        return true;
      }
      const questions = await this.gradingIndex.getTestQuestions(
        pendingRun.testKey,
        pendingRun.selectedParts,
      );

      return await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<Array<{ id: string }>>(
          Prisma.sql`SELECT "id" FROM "toeic_learning_runs" WHERE "id" = ${runId} FOR UPDATE`,
        );
        if (!rows[0]) {
          throw new NotFoundException('TOEIC session not found.');
        }
        const run = await tx.toeicLearningRun.findUnique({
          where: { id: runId },
          include: { answers: true },
        });
        if (!run || run.completedAt || !run.finishRequestedAt || !run.testKey) {
          return true;
        }

        const answers = new Map(
          run.answers.map((answer) => [answer.questionKey, answer]),
        );
        let totalRight = 0;
        await Promise.all(
          questions.map((question) => {
            const answer = answers.get(question.questionKey);
            const isCorrect = answer?.selectedKey === question.answerKey;
            if (isCorrect) {
              totalRight += 1;
            }
            return answer
              ? tx.toeicLearningRunAnswer.update({
                  where: { id: answer.id },
                  data: {
                    status: isCorrect
                      ? ToeicRunQuestionStatus.RIGHT
                      : ToeicRunQuestionStatus.WRONG,
                    gradedAt: new Date(),
                  },
                })
              : Promise.resolve();
          }),
        );
        await tx.toeicLearningRun.update({
          where: { id: run.id },
          data: {
            totalRight,
            totalWrong: questions.length - totalRight,
            completedAt: new Date(),
          },
        });
        return true;
      });
    } catch (error) {
      this.logger.error(
        `Failed to finish TOEIC runtime run ${runId}.`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}
