import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ToeicRunScope,
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
import type { SelectToeicRuntimeMockRunDto } from '../api/dto/select-mock-run.dto';
import type { UpdateMockTimerDto } from '../api/dto/update-mock-timer.dto';

type RuntimeRun = {
  id: string;
  scope: ToeicRunScope;
  testKey: string | null;
  partNumber: number | null;
  mode: ToeicRunMode;
  selectedParts: number[];
  totalRight: number;
  totalWrong: number;
  timeLimitSeconds: number | null;
  remainingSeconds: number | null;
  finishRequestedAt: Date | null;
  completedAt: Date | null;
  answers: Array<{
    questionKey: string;
    selectedKey: string;
    status: ToeicRunQuestionStatus;
  }>;
};

const MOCK_FINISH_RETRY_DELAYS_MS = [1_000, 2_000, 5_000] as const;
const MOCK_PART_TIME_LIMIT_SECONDS: Record<number, number> = {
  1: 5 * 60,
  2: 10 * 60,
  3: 15 * 60,
  4: 15 * 60,
  5: 10 * 60,
  6: 10 * 60,
  7: 55 * 60,
};

function normalizeParts(parts: number[]): number[] {
  return [...new Set(parts)].sort((left, right) => left - right);
}

function getMockTimeLimitSeconds(
  parts: number[],
  timeLimitMinutes?: number,
): number {
  if (timeLimitMinutes !== undefined) {
    return timeLimitMinutes * 60;
  }

  return parts.reduce((total, partNumber) => {
    const partTimeLimit = MOCK_PART_TIME_LIMIT_SECONDS[partNumber];
    if (partTimeLimit === undefined) {
      throw new BadRequestException('Selected part is unavailable.');
    }

    return total + partTimeLimit;
  }, 0);
}

function getReadingScore(correctCount: number): number {
  if (correctCount <= 3) {
    return 5;
  }

  if (correctCount === 4) {
    return 10;
  }

  return Math.min(495, correctCount * 5 - 5);
}

function getListeningScore(correctCount: number): number {
  if (correctCount <= 0) {
    return 5;
  }

  if (correctCount <= 75) {
    return correctCount * 5 + 10;
  }

  return Math.min(495, correctCount * 5 + 15);
}

function formatRun(run: RuntimeRun) {
  return {
    sessionId: run.id,
    scope: run.scope === ToeicRunScope.TEST ? 'test' : 'part_practice',
    testKey: run.testKey,
    partNumber: run.partNumber,
    mode: run.mode === ToeicRunMode.MOCK_TEST ? 'mock_test' : 'practice',
    selectedParts: run.selectedParts,
    correctCount: run.totalRight,
    wrongCount: run.totalWrong,
    timer:
      run.mode === ToeicRunMode.MOCK_TEST &&
      run.timeLimitSeconds !== null &&
      run.remainingSeconds !== null
        ? {
            timeLimitSeconds: run.timeLimitSeconds,
            remainingSeconds: run.remainingSeconds,
          }
        : null,
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
        ? await this.findOrCreateMockTestRun(
            userId,
            dto.testKey,
            selectedParts,
            dto.timeLimitMinutes,
          )
        : await this.findOrCreatePracticeTestRun(
            userId,
            dto.testKey,
            selectedParts,
          );

    return formatRun(run);
  }

  async prepareMockRun(userId: string, dto: SelectToeicRuntimeMockRunDto) {
    const selectedParts = normalizeParts(dto.partNumbers);
    if (!(await this.gradingIndex.hasTestParts(dto.testKey, selectedParts))) {
      throw new BadRequestException('Test or selected parts are unavailable.');
    }

    const run = await this.prisma.toeicRun.findFirst({
      where: this.openMockRunWhere(userId, dto.testKey, selectedParts),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        selectedParts: true,
        finishRequestedAt: true,
      },
    });
    if (!run) {
      return { status: 'available' as const };
    }

    return {
      status: run.finishRequestedAt ? ('pending' as const) : ('open' as const),
      run: {
        sessionId: run.id,
        selectedParts: run.selectedParts,
      },
    };
  }

  async restartMockRun(userId: string, dto: SelectToeicRuntimeMockRunDto) {
    const selectedParts = normalizeParts(dto.partNumbers);
    if (!(await this.gradingIndex.hasTestParts(dto.testKey, selectedParts))) {
      throw new BadRequestException('Test or selected parts are unavailable.');
    }

    return this.prisma
      .$transaction(async (tx) => {
        await this.lockMockRunSelection(tx, userId, dto.testKey, selectedParts);
        const openRuns = await tx.toeicRun.findMany({
          where: this.openMockRunWhere(userId, dto.testKey, selectedParts),
          select: { id: true, finishRequestedAt: true },
        });
        if (openRuns.some((run) => run.finishRequestedAt)) {
          throw new ConflictException('TOEIC mock test is being graded.');
        }
        if (openRuns.length > 0) {
          await tx.toeicRun.deleteMany({
            where: { id: { in: openRuns.map((run) => run.id) } },
          });
        }

        return this.createMockTestRun(
          tx,
          userId,
          dto.testKey,
          selectedParts,
          dto.timeLimitMinutes,
        );
      })
      .then(formatRun);
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
      const existing = await tx.toeicRun.findFirst({
        where: {
          userId,
          scope: ToeicRunScope.PART_PRACTICE,
          partNumber: dto.partNumber,
          mode: ToeicRunMode.PRACTICE,
        },
        include: { answers: true },
      });

      return (
        existing ??
        tx.toeicRun.create({
          data: {
            userId,
            scope: ToeicRunScope.PART_PRACTICE,
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
    const runs = await this.prisma.toeicRun.findMany({
      where: {
        userId,
        scope: ToeicRunScope.TEST,
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

  async listMockRuns(userId: string, testKey: string) {
    const runs = await this.prisma.toeicRun.findMany({
      where: {
        userId,
        scope: ToeicRunScope.TEST,
        testKey,
        mode: ToeicRunMode.MOCK_TEST,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        selectedParts: true,
        totalRight: true,
        totalWrong: true,
        finishRequestedAt: true,
        completedAt: true,
        answers: { select: { questionKey: true, status: true } },
      },
    });

    return {
      items: await Promise.all(
        runs.map(async (run) => {
          if (!run.completedAt) {
            return {
              sessionId: run.id,
              selectedParts: run.selectedParts,
              status: run.finishRequestedAt ? 'pending' : 'open',
            };
          }

          const questions = await this.gradingIndex.getTestQuestions(
            testKey,
            run.selectedParts,
          );
          const listeningQuestionKeys = new Set(
            questions
              .filter((question) => question.partNumber <= 4)
              .map((question) => question.questionKey),
          );
          const listeningCorrectCount = run.answers.filter(
            (answer) =>
              answer.status === ToeicRunQuestionStatus.RIGHT &&
              listeningQuestionKeys.has(answer.questionKey),
          ).length;
          const readingCorrectCount = run.totalRight - listeningCorrectCount;
          const listening = getListeningScore(listeningCorrectCount);
          const reading = getReadingScore(readingCorrectCount);

          return {
            sessionId: run.id,
            selectedParts: run.selectedParts,
            correctCount: run.totalRight,
            wrongCount: run.totalWrong,
            score: { listening, reading, total: listening + reading },
            status: 'completed',
          };
        }),
      ),
    };
  }

  async clearTestPracticeRun(userId: string, testKey: string) {
    const result = await this.prisma.toeicRun.deleteMany({
      where: {
        userId,
        scope: ToeicRunScope.TEST,
        testKey,
        mode: ToeicRunMode.PRACTICE,
      },
    });

    return { resetRunCount: result.count };
  }

  async listPartPracticeRuns(userId: string) {
    const runs = await this.prisma.toeicRun.findMany({
      where: {
        userId,
        scope: ToeicRunScope.PART_PRACTICE,
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

    const result = await this.prisma.toeicRun.deleteMany({
      where: {
        userId,
        scope: ToeicRunScope.PART_PRACTICE,
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
      await this.saveMockAnswer(
        run.id,
        dto.questionKey,
        dto.selectedKey,
        dto.remainingSeconds,
      );
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
    const initial = await this.findOwnedRun(userId, sessionId);
    if (
      initial.scope !== ToeicRunScope.TEST ||
      initial.mode !== ToeicRunMode.MOCK_TEST ||
      !initial.testKey
    ) {
      throw new BadRequestException('Only mock test runs can be finished.');
    }
    const testKey = initial.testKey;

    const result = await this.prisma.$transaction(async (tx) => {
      await this.lockMockRunSelection(
        tx,
        userId,
        testKey,
        initial.selectedParts,
      );
      const run = await tx.toeicRun.findFirst({
        where: { id: sessionId, userId },
        select: { completedAt: true, finishRequestedAt: true },
      });
      if (!run) {
        throw new NotFoundException('TOEIC session not found.');
      }
      if (run.completedAt) {
        return { status: 'completed' as const };
      }
      if (!run.finishRequestedAt) {
        await tx.toeicRun.update({
          where: { id: sessionId },
          data: { finishRequestedAt: new Date() },
        });
      }

      return { status: 'accepted' as const };
    });
    if (result.status === 'accepted') {
      this.scheduleMockCompletion(sessionId);
    }

    return result;
  }

  async updateMockTimer(
    userId: string,
    sessionId: string,
    dto: UpdateMockTimerDto,
  ) {
    const run = await this.findOwnedRun(userId, sessionId);
    if (
      run.scope !== ToeicRunScope.TEST ||
      run.mode !== ToeicRunMode.MOCK_TEST
    ) {
      throw new BadRequestException('Only mock test timers can be updated.');
    }

    return this.prisma.$transaction(async (tx) => {
      const lockedRun = await this.lockOpenRun(tx, run.id);
      if (lockedRun.remainingSeconds === null) {
        throw new BadRequestException('TOEIC mock timer is unavailable.');
      }

      const remainingSeconds = Math.min(
        lockedRun.remainingSeconds,
        dto.remainingSeconds,
      );
      if (remainingSeconds !== lockedRun.remainingSeconds) {
        await tx.toeicRun.update({
          where: { id: run.id },
          data: { remainingSeconds },
        });
      }

      return { remainingSeconds };
    });
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
      const existing = await tx.toeicRun.findFirst({
        where: {
          userId,
          scope: ToeicRunScope.TEST,
          testKey,
          mode: ToeicRunMode.PRACTICE,
        },
        include: { answers: true },
      });

      if (!existing) {
        return tx.toeicRun.create({
          data: {
            userId,
            scope: ToeicRunScope.TEST,
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

      return tx.toeicRun.update({
        where: { id: existing.id },
        data: { selectedParts: nextParts },
        include: { answers: true },
      });
    });
  }

  private async findOrCreateMockTestRun(
    userId: string,
    testKey: string,
    selectedParts: number[],
    timeLimitMinutes?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockMockRunSelection(tx, userId, testKey, selectedParts);
      const existing = await tx.toeicRun.findFirst({
        where: this.openMockRunWhere(userId, testKey, selectedParts),
        orderBy: { createdAt: 'desc' },
        include: { answers: true },
      });

      return (
        existing ??
        this.createMockTestRun(
          tx,
          userId,
          testKey,
          selectedParts,
          timeLimitMinutes,
        )
      );
    });
  }

  private createMockTestRun(
    tx: Prisma.TransactionClient,
    userId: string,
    testKey: string,
    selectedParts: number[],
    timeLimitMinutes?: number,
  ) {
    const timeLimitSeconds = getMockTimeLimitSeconds(
      selectedParts,
      timeLimitMinutes,
    );

    return tx.toeicRun.create({
      data: {
        userId,
        scope: ToeicRunScope.TEST,
        testKey,
        mode: ToeicRunMode.MOCK_TEST,
        selectedParts,
        timeLimitSeconds,
        remainingSeconds: timeLimitSeconds,
      },
      include: { answers: true },
    });
  }

  private openMockRunWhere(
    userId: string,
    testKey: string,
    selectedParts: number[],
  ) {
    return {
      userId,
      scope: ToeicRunScope.TEST,
      testKey,
      mode: ToeicRunMode.MOCK_TEST,
      selectedParts: { equals: selectedParts },
      completedAt: null,
    };
  }

  private lockMockRunSelection(
    tx: Prisma.TransactionClient,
    userId: string,
    testKey: string,
    selectedParts: number[],
  ) {
    return tx.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${`mock:${testKey}:${selectedParts.join(',')}`}))`,
    );
  }

  private findOwnedRun(userId: string, sessionId: string): Promise<RuntimeRun> {
    return this.prisma.toeicRun
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
    return run.scope === ToeicRunScope.TEST
      ? run.testKey === question.testKey &&
          run.selectedParts.includes(question.partNumber)
      : run.partNumber === question.partNumber;
  }

  private async saveMockAnswer(
    runId: string,
    questionKey: string,
    selectedKey: string,
    remainingSeconds?: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const run = await this.lockOpenRun(tx, runId);
      if (run.remainingSeconds === 0) {
        throw new BadRequestException('TOEIC mock time has expired.');
      }
      if (remainingSeconds !== undefined && run.remainingSeconds !== null) {
        const nextRemainingSeconds = Math.min(
          run.remainingSeconds,
          remainingSeconds,
        );
        if (nextRemainingSeconds !== run.remainingSeconds) {
          await tx.toeicRun.update({
            where: { id: runId },
            data: { remainingSeconds: nextRemainingSeconds },
          });
        }
      }
      await tx.toeicRunAnswer.upsert({
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
      const existing = await tx.toeicRunAnswer.findUnique({
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

      await tx.toeicRunAnswer.upsert({
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

      const answers = await tx.toeicRunAnswer.findMany({
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
          return tx.toeicRunAnswer.update({
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
        remainingSeconds: number | null;
      }>
    >(
      Prisma.sql`SELECT "id", "finish_requested_at" AS "finishRequestedAt", "completed_at" AS "completedAt", "remaining_seconds" AS "remainingSeconds" FROM "toeic_runs" WHERE "id" = ${runId} FOR UPDATE`,
    );
    const run = rows[0];
    if (!run) {
      throw new NotFoundException('TOEIC session not found.');
    }
    if (run.completedAt || run.finishRequestedAt) {
      throw new BadRequestException('TOEIC run is not open for answers.');
    }

    return run;
  }

  private async recalculateTotals(tx: Prisma.TransactionClient, runId: string) {
    const [totalRight, totalWrong] = await Promise.all([
      tx.toeicRunAnswer.count({
        where: { runId, status: ToeicRunQuestionStatus.RIGHT },
      }),
      tx.toeicRunAnswer.count({
        where: { runId, status: ToeicRunQuestionStatus.WRONG },
      }),
    ]);
    await tx.toeicRun.update({
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
      const pendingRun = await this.prisma.toeicRun.findUnique({
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
          Prisma.sql`SELECT "id" FROM "toeic_runs" WHERE "id" = ${runId} FOR UPDATE`,
        );
        if (!rows[0]) {
          throw new NotFoundException('TOEIC session not found.');
        }
        const run = await tx.toeicRun.findUnique({
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
              ? tx.toeicRunAnswer.update({
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
        await tx.toeicRun.update({
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
