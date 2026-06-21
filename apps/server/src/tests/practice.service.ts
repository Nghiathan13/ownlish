import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ToeicRunGroupStatus,
  ToeicRunMode,
  ToeicRunQuestionStatus,
  type ToeicQuestion,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  countOptions,
  getOptionText,
  getOptionViText,
  isToeicQuestionOptionKey,
  mapQuestionOptions,
  parseAnswerKey,
} from './lib/toeic-question-mapper';
import { SubmitToeicAnswerDto } from './dto/submit-toeic-answer.dto';
import { CreateToeicSessionDto } from './dto/create-toeic-session.dto';
import { TestsStorageService } from './tests-storage.service';

type SubmitAnswerResponse = {
  graded: boolean;
  isCorrect?: boolean;
  answerKey?: 'A' | 'B' | 'C' | 'D';
  correctOptionEn?: string | null;
  correctOptionVi?: string | null;
};

type RunQuestionForResponse = {
  toeicQuestionId: number;
  selectedKey: string | null;
  status: ToeicRunQuestionStatus | null;
  toeicQuestion: { answerKey: string | null };
};

type RunQuestionWithQuestionForResponse = {
  toeicQuestionId: number;
  selectedKey: string | null;
  status: ToeicRunQuestionStatus | null;
  toeicQuestion: ToeicQuestion;
};

type RunGroupForResponse = {
  toeicQuestionGroupId: number;
  partNumber: number;
  questionStart: number;
  questionEnd: number;
  sortOrder: number;
  status: ToeicRunGroupStatus | null;
  toeicQuestionGroup: {
    id: number;
    groupType: string | null;
    accent: string | null;
    content: string | null;
    contentVi: string | null;
    audioStoragePath: string | null;
    imageStoragePath: string | null;
  };
  questions: RunQuestionWithQuestionForResponse[];
};

type RunForResponse = {
  id: string;
  mode: ToeicRunMode;
  toeicTestId: number;
  selectedParts: number[];
  totalRight: number;
  totalWrong: number;
  completedAt: Date | null;
  questions: RunQuestionForResponse[];
  groups: RunGroupForResponse[];
};

type QuestionWithGroup = ToeicQuestion & {
  group: {
    id: number;
    testPart: {
      testId: number;
      partNumber: number;
    };
  };
};

type RunQuestionWithQuestion = {
  id: string;
  runId: string;
  runGroupId: string;
  toeicQuestionId: number;
  partNumber: number;
  selectedKey: string | null;
  status: ToeicRunQuestionStatus | null;
  toeicQuestion: ToeicQuestion;
};

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: TestsStorageService,
  ) {}

  async createSession(userId: string, dto: CreateToeicSessionDto) {
    const selectedParts = this.resolveSelectedParts(dto);
    const mode = this.resolveRunMode(dto.mode);

    await this.assertTestAndPartsExist(dto.testId, selectedParts);

    if (mode === ToeicRunMode.MOCK_TEST) {
      const run = await this.createRunWithQuestions({
        userId,
        testId: dto.testId,
        mode,
        selectedParts,
      });

      return this.formatSessionResponse(run);
    }

    if (mode === ToeicRunMode.WRONG_REVIEW) {
      const run = await this.createWrongReviewRun(
        userId,
        dto.testId,
        selectedParts,
      );
      return this.formatSessionResponse(run);
    }

    const existingRun = await this.findLatestPracticeRun(userId, dto.testId);

    if (existingRun) {
      await this.ensurePracticeRunIncludesParts(
        existingRun.id,
        dto.testId,
        selectedParts,
      );

      const refreshedRun = await this.getRunForResponse(existingRun.id);
      if (!refreshedRun) {
        throw new NotFoundException('Practice session not found.');
      }

      return this.formatSessionResponse(refreshedRun);
    }

    const run = await this.createRunWithQuestions({
      userId,
      testId: dto.testId,
      mode,
      selectedParts,
    });

    return this.formatSessionResponse(run);
  }

  private resolveRunMode(mode: CreateToeicSessionDto['mode']): ToeicRunMode {
    if (mode === 'review_wrong') {
      return ToeicRunMode.WRONG_REVIEW;
    }

    if (mode === 'mock_test') {
      return ToeicRunMode.MOCK_TEST;
    }

    return ToeicRunMode.PRACTICE;
  }

  private resolveSelectedParts(dto: CreateToeicSessionDto): number[] {
    const selectedParts = [...new Set(dto.partNumbers)].sort((a, b) => a - b);

    if (selectedParts.length === 0) {
      throw new BadRequestException('Select at least one test part.');
    }

    return selectedParts;
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

  private findLatestPracticeRun(
    userId: string,
    testId: number,
  ): Promise<RunForResponse | null> {
    return this.prisma.toeicRun.findFirst({
      where: {
        userId,
        toeicTestId: testId,
        mode: ToeicRunMode.PRACTICE,
      },
      orderBy: { createdAt: 'desc' },
      include: this.runResponseInclude(),
    });
  }

  private runResponseInclude() {
    return {
      questions: {
        orderBy: { sortOrder: 'asc' as const },
        include: {
          toeicQuestion: {
            select: { answerKey: true },
          },
        },
      },
      groups: {
        orderBy: { sortOrder: 'asc' as const },
        include: {
          toeicQuestionGroup: {
            select: {
              id: true,
              groupType: true,
              accent: true,
              content: true,
              contentVi: true,
              audioStoragePath: true,
              imageStoragePath: true,
            },
          },
          questions: {
            orderBy: { sortOrder: 'asc' as const },
            include: {
              toeicQuestion: true,
            },
          },
        },
      },
    } satisfies Prisma.ToeicRunInclude;
  }

  private async formatSessionResponse(session: RunForResponse) {
    const signedUrls = await this.storageService.createSignedUrls(
      session.groups.flatMap((group) => [
        group.toeicQuestionGroup.audioStoragePath,
        group.toeicQuestionGroup.imageStoragePath,
      ]),
    );

    const answerByQuestionId = new Map(
      session.questions.map((answer) => [answer.toeicQuestionId, answer]),
    );

    return {
      sessionId: session.id,
      mode:
        session.mode === ToeicRunMode.WRONG_REVIEW
          ? 'review_wrong'
          : session.mode === ToeicRunMode.MOCK_TEST
            ? 'mock_test'
          : 'practice',
      testId: session.toeicTestId,
      partNumbers: session.selectedParts,
      correctCount: session.totalRight,
      wrongCount: session.totalWrong,
      completedAt: session.completedAt?.toISOString() ?? null,
      groups: session.groups.map((group) => {
        const audioSigned = group.toeicQuestionGroup.audioStoragePath
          ? signedUrls.get(group.toeicQuestionGroup.audioStoragePath)
          : null;
        const imageSigned = group.toeicQuestionGroup.imageStoragePath
          ? signedUrls.get(group.toeicQuestionGroup.imageStoragePath)
          : null;

        return {
          id: group.toeicQuestionGroupId,
          partNumber: group.partNumber,
          questionStart: group.questionStart,
          questionEnd: group.questionEnd,
          groupStatus: this.formatGroupStatus(group.status),
          groupType: group.toeicQuestionGroup.groupType,
          accent: group.toeicQuestionGroup.accent,
          content: group.toeicQuestionGroup.content,
          contentVi: group.toeicQuestionGroup.contentVi,
          audioUrl: audioSigned?.url ?? null,
          audioUrlExpiresAt: audioSigned?.expiresAt ?? null,
          imageUrl: imageSigned?.url ?? null,
          imageUrlExpiresAt: imageSigned?.expiresAt ?? null,
          questions: group.questions.map((question) => {
            const answer = answerByQuestionId.get(question.toeicQuestionId);
            const selectedKey = answer?.selectedKey?.trim().toUpperCase();
            const answerKey = parseAnswerKey(question.toeicQuestion.answerKey);

            return {
              id: question.toeicQuestionId,
              questionNumber: question.toeicQuestion.questionNumber,
              question: question.toeicQuestion.question,
              questionVi: question.toeicQuestion.questionVi,
              options: mapQuestionOptions(question.toeicQuestion),
              optionCount: countOptions(question.toeicQuestion),
              answerKey,
              selectedKey: selectedKey && isToeicQuestionOptionKey(selectedKey)
                ? selectedKey
                : null,
              status: this.formatQuestionStatus(answer?.status ?? null),
              isCorrect: this.formatQuestionCorrectness(answer?.status ?? null),
            };
          }),
        };
      }),
    };
  }

  private formatGroupStatus(status: ToeicRunGroupStatus | null) {
    if (status === ToeicRunGroupStatus.RIGHT) {
      return 'right';
    }

    if (status === ToeicRunGroupStatus.WRONG) {
      return 'wrong';
    }

    return null;
  }

  private formatQuestionStatus(status: ToeicRunQuestionStatus | null) {
    if (status === ToeicRunQuestionStatus.SELECTED) {
      return 'selected';
    }

    if (status === ToeicRunQuestionStatus.RIGHT) {
      return 'right';
    }

    if (status === ToeicRunQuestionStatus.WRONG) {
      return 'wrong';
    }

    return null;
  }

  private formatQuestionCorrectness(status: ToeicRunQuestionStatus | null) {
    if (status === ToeicRunQuestionStatus.RIGHT) {
      return true;
    }

    if (status === ToeicRunQuestionStatus.WRONG) {
      return false;
    }

    return null;
  }

  private async createEmptyRun(input: {
    userId: string;
    testId: number;
    mode: ToeicRunMode;
    selectedParts: number[];
  }): Promise<RunForResponse> {
    const run = await this.prisma.toeicRun.create({
      data: {
        userId: input.userId,
        toeicTestId: input.testId,
        mode: input.mode,
        selectedParts: input.selectedParts,
      },
      include: this.runResponseInclude(),
    });

    return run;
  }

  private async ensurePracticeRunIncludesParts(
    runId: string,
    testId: number,
    selectedParts: number[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const run = await tx.toeicRun.findUnique({
        where: { id: runId },
        include: {
          groups: {
            select: {
              toeicQuestionGroupId: true,
              partNumber: true,
              sortOrder: true,
            },
          },
        },
      });

      if (!run) {
        return;
      }

      const nextSelectedParts = [
        ...new Set([...run.selectedParts, ...selectedParts]),
      ].sort((a, b) => a - b);
      const existingGroupIds = new Set(
        run.groups.map((group) => group.toeicQuestionGroupId),
      );
      let nextGroupSortOrder =
        run.groups.reduce(
          (highest, group) => Math.max(highest, group.sortOrder),
          -1,
        ) + 1;

      const groups = await tx.toeicQuestionGroup.findMany({
        where: {
          testPart: {
            testId,
            partNumber: { in: selectedParts },
          },
        },
        include: {
          testPart: {
            select: { partNumber: true },
          },
          questions: {
            orderBy: { questionNumber: 'asc' },
          },
        },
        orderBy: [{ questionStart: 'asc' }, { id: 'asc' }],
      });

      for (const group of groups) {
        if (existingGroupIds.has(group.id)) {
          continue;
        }

        const runGroup = await tx.toeicRunGroup.create({
          data: {
            runId,
            toeicQuestionGroupId: group.id,
            partNumber: group.testPart.partNumber,
            questionStart: group.questionStart,
            questionEnd: group.questionEnd,
            sortOrder: nextGroupSortOrder,
          },
        });
        nextGroupSortOrder += 1;

        await tx.toeicRunQuestion.createMany({
          data: group.questions.map((question) => ({
            runId,
            runGroupId: runGroup.id,
            toeicQuestionId: question.id,
            partNumber: group.testPart.partNumber,
            questionNumber: question.questionNumber,
            sortOrder: question.questionNumber,
          })),
        });
      }

      if (nextSelectedParts.join(',') !== run.selectedParts.join(',')) {
        await tx.toeicRun.update({
          where: { id: runId },
          data: { selectedParts: nextSelectedParts },
        });
      }
    });
  }

  private async createRunWithQuestions(input: {
    userId: string;
    testId: number;
    mode: ToeicRunMode;
    selectedParts: number[];
  }): Promise<RunForResponse> {
    const groups = await this.listGroupsForRun(
      input.testId,
      input.selectedParts,
    );

    const run = await this.prisma.$transaction(async (tx) => {
      const createdRun = await tx.toeicRun.create({
        data: {
          userId: input.userId,
          toeicTestId: input.testId,
          mode: input.mode,
          selectedParts: input.selectedParts,
        },
      });

      for (const [groupIndex, group] of groups.entries()) {
        const runGroup = await tx.toeicRunGroup.create({
          data: {
            runId: createdRun.id,
            toeicQuestionGroupId: group.id,
            partNumber: group.testPart.partNumber,
            questionStart: group.questionStart,
            questionEnd: group.questionEnd,
            sortOrder: groupIndex,
          },
        });

        await tx.toeicRunQuestion.createMany({
          data: group.questions.map((question) => ({
            runId: createdRun.id,
            runGroupId: runGroup.id,
            toeicQuestionId: question.id,
            partNumber: group.testPart.partNumber,
            questionNumber: question.questionNumber,
            sortOrder: question.questionNumber,
          })),
        });
      }

      return createdRun;
    });

    const created = await this.getRunForResponse(run.id);
    if (!created) {
      throw new NotFoundException('Practice session not found.');
    }

    return created;
  }

  private async listGroupsForRun(testId: number, selectedParts: number[]) {
    return this.prisma.toeicQuestionGroup.findMany({
      where: {
        testPart: {
          testId,
          partNumber: { in: selectedParts },
        },
      },
      include: {
        testPart: {
          select: { partNumber: true },
        },
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
      orderBy: [{ questionStart: 'asc' }, { id: 'asc' }],
    });
  }

  private async createWrongReviewRun(
    userId: string,
    testId: number,
    selectedParts: number[],
  ): Promise<RunForResponse> {
    const practiceRun = await this.findLatestPracticeRunWithGroups(
      userId,
      testId,
    );

    if (!practiceRun) {
      return this.createEmptyRun({
        userId,
        testId,
        mode: ToeicRunMode.WRONG_REVIEW,
        selectedParts,
      });
    }

    const selectedPartSet = new Set(selectedParts);
    const wrongGroups = practiceRun.groups.filter(
      (group) =>
        selectedPartSet.has(group.partNumber) &&
        (group.status === ToeicRunGroupStatus.WRONG ||
          group.questions.some(
            (question) => question.status === ToeicRunQuestionStatus.WRONG,
          )),
    );

    if (wrongGroups.length === 0) {
      return this.createEmptyRun({
        userId,
        testId,
        mode: ToeicRunMode.WRONG_REVIEW,
        selectedParts,
      });
    }

    const run = await this.prisma.$transaction(async (tx) => {
      const createdRun = await tx.toeicRun.create({
        data: {
          userId,
          toeicTestId: testId,
          mode: ToeicRunMode.WRONG_REVIEW,
          selectedParts,
        },
      });

      for (const [groupIndex, practiceGroup] of wrongGroups.entries()) {
        const runGroup = await tx.toeicRunGroup.create({
          data: {
            runId: createdRun.id,
            toeicQuestionGroupId: practiceGroup.toeicQuestionGroupId,
            partNumber: practiceGroup.partNumber,
            questionStart: practiceGroup.questionStart,
            questionEnd: practiceGroup.questionEnd,
            sortOrder: groupIndex,
            status: practiceGroup.status,
          },
        });

        await tx.toeicRunQuestion.createMany({
          data: practiceGroup.questions.map((question) => {
            const isLockedRight =
              question.status === ToeicRunQuestionStatus.RIGHT;

            return {
              runId: createdRun.id,
              runGroupId: runGroup.id,
              toeicQuestionId: question.toeicQuestionId,
              partNumber: question.partNumber,
              questionNumber: question.questionNumber,
              sortOrder: question.sortOrder,
              selectedKey: isLockedRight ? question.selectedKey : null,
              status: isLockedRight ? ToeicRunQuestionStatus.RIGHT : null,
              answeredAt: isLockedRight ? question.answeredAt : null,
              gradedAt: isLockedRight ? question.gradedAt : null,
            };
          }),
        });
      }

      return createdRun;
    });

    await this.recalculateRunTotals(this.prisma, run.id);

    const created = await this.getRunForResponse(run.id);
    if (!created) {
      throw new NotFoundException('Practice session not found.');
    }

    return created;
  }

  private findLatestPracticeRunWithGroups(userId: string, testId: number) {
    return this.prisma.toeicRun.findFirst({
      where: {
        userId,
        toeicTestId: testId,
        mode: ToeicRunMode.PRACTICE,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        groups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            questions: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  private async getRunForResponse(
    runId: string,
  ): Promise<RunForResponse | null> {
    return this.prisma.toeicRun.findUnique({
      where: { id: runId },
      include: this.runResponseInclude(),
    });
  }

  async getRun(userId: string, sessionId: string) {
    const run = await this.prisma.toeicRun.findFirst({
      where: { id: sessionId, userId },
      include: this.runResponseInclude(),
    });

    if (!run) {
      throw new NotFoundException('TOEIC run not found.');
    }

    return this.formatSessionResponse(run);
  }

  private buildGradedResponse(
    question: ToeicQuestion,
    answerKey: 'A' | 'B' | 'C' | 'D',
    isCorrect: boolean,
  ): SubmitAnswerResponse {
    return {
      graded: true,
      isCorrect,
      answerKey,
      correctOptionEn: getOptionText(question, answerKey),
      correctOptionVi: getOptionViText(question, answerKey),
    };
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitToeicAnswerDto,
  ) {
    const run = await this.prisma.toeicRun.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!run) {
      throw new NotFoundException('Practice session not found.');
    }

    if (run.completedAt) {
      throw new BadRequestException('TOEIC run is already completed.');
    }

    const question = await this.prisma.toeicQuestion.findUnique({
      where: { id: dto.toeicQuestionId },
      include: {
        group: {
          include: {
            testPart: true,
          },
        },
      },
    });

    if (!question || question.group.testPart.testId !== run.toeicTestId) {
      throw new BadRequestException(
        'Question does not belong to this session.',
      );
    }

    const answerKey = parseAnswerKey(question.answerKey);
    const selectedKey = dto.selectedKey.trim().toUpperCase();

    if (!answerKey) {
      throw new BadRequestException('Question has an invalid answer key.');
    }

    if (!isToeicQuestionOptionKey(selectedKey)) {
      throw new BadRequestException('Invalid answer.');
    }

    const runQuestion = await this.prisma.toeicRunQuestion.findUnique({
      where: {
        runId_toeicQuestionId: {
          runId: run.id,
          toeicQuestionId: question.id,
        },
      },
      include: { toeicQuestion: true },
    });

    if (!runQuestion) {
      throw new BadRequestException(
        'Question does not belong to this session.',
      );
    }

    if (run.mode === ToeicRunMode.MOCK_TEST) {
      return this.submitMockAnswer(runQuestion, selectedKey);
    }

    if (runQuestion.status === ToeicRunQuestionStatus.RIGHT) {
      return this.buildGradedResponse(question, answerKey, true);
    }

    return this.submitGroupAnswer(
      userId,
      run,
      runQuestion,
      question,
      selectedKey,
      answerKey,
    );
  }

  private async submitMockAnswer(
    runQuestion: RunQuestionWithQuestion,
    selectedKey: 'A' | 'B' | 'C' | 'D',
  ): Promise<SubmitAnswerResponse> {
    await this.prisma.toeicRunQuestion.update({
      where: { id: runQuestion.id },
      data: {
        selectedKey,
        status: ToeicRunQuestionStatus.SELECTED,
        answeredAt: new Date(),
      },
    });

    return { graded: false };
  }

  private async submitGroupAnswer(
    userId: string,
    run: {
      id: string;
      mode: ToeicRunMode;
      toeicTestId: number;
      selectedParts: number[];
    },
    runQuestion: RunQuestionWithQuestion,
    question: QuestionWithGroup,
    selectedKey: 'A' | 'B' | 'C' | 'D',
    answerKey: 'A' | 'B' | 'C' | 'D',
  ): Promise<SubmitAnswerResponse> {
    let graded = false;

    await this.prisma.$transaction(async (tx) => {
      await tx.toeicRunQuestion.update({
        where: { id: runQuestion.id },
        data: {
          selectedKey,
          status: ToeicRunQuestionStatus.SELECTED,
          answeredAt: new Date(),
        },
      });

      if (await this.isRunGroupReadyToGrade(tx, runQuestion.runGroupId)) {
        await this.gradeRunGroup(tx, userId, run, runQuestion.runGroupId);
        graded = true;
      }
    });

    if (!graded) {
      return { graded: false };
    }

    return this.buildGradedResponse(
      question,
      answerKey,
      selectedKey === answerKey,
    );
  }

  private async isRunGroupReadyToGrade(
    tx: Prisma.TransactionClient,
    runGroupId: string,
  ): Promise<boolean> {
    const questions = await tx.toeicRunQuestion.findMany({
      where: { runGroupId },
      select: { selectedKey: true, status: true },
    });

    return (
      questions.length > 0 &&
      questions.every(
        (question) =>
          question.status === ToeicRunQuestionStatus.RIGHT ||
          Boolean(question.selectedKey),
      )
    );
  }

  private async gradeRunGroup(
    tx: Prisma.TransactionClient,
    userId: string,
    run: {
      id: string;
      mode: ToeicRunMode;
      toeicTestId: number;
      selectedParts: number[];
    },
    runGroupId: string,
  ): Promise<void> {
    const questions = await tx.toeicRunQuestion.findMany({
      where: { runGroupId },
      include: { toeicQuestion: true },
    });

    for (const question of questions) {
      if (question.status === ToeicRunQuestionStatus.RIGHT) {
        continue;
      }

      const answerKey = parseAnswerKey(question.toeicQuestion.answerKey);
      const selectedKey = question.selectedKey?.trim().toUpperCase();

      if (
        !answerKey ||
        !selectedKey ||
        !isToeicQuestionOptionKey(selectedKey)
      ) {
        continue;
      }

      const isCorrect = selectedKey === answerKey;
      await this.gradeRunQuestion(tx, {
        run,
        runQuestion: question,
        selectedKey,
        isCorrect,
      });

      if (run.mode === ToeicRunMode.WRONG_REVIEW) {
        await this.markLatestPracticeQuestion(tx, {
          userId,
          testId: run.toeicTestId,
          toeicQuestionId: question.toeicQuestionId,
          selectedKey,
          isCorrect,
        });
      }
    }
  }

  private async gradeRunQuestion(
    tx: Prisma.TransactionClient,
    input: {
      run: { id: string; mode: ToeicRunMode };
      runQuestion: {
        id: string;
        runId: string;
        runGroupId: string;
        status: ToeicRunQuestionStatus | null;
      };
      selectedKey: string;
      isCorrect: boolean;
    },
  ): Promise<void> {
    if (input.runQuestion.status === ToeicRunQuestionStatus.RIGHT) {
      return;
    }

    await tx.toeicRunQuestion.update({
      where: { id: input.runQuestion.id },
      data: {
        selectedKey: input.selectedKey,
        status: input.isCorrect
          ? ToeicRunQuestionStatus.RIGHT
          : ToeicRunQuestionStatus.WRONG,
        answeredAt: new Date(),
        gradedAt: new Date(),
      },
    });

    await this.refreshRunGroupStatus(tx, input.runQuestion.runGroupId);
    await this.recalculateRunTotals(tx, input.run.id);
  }

  private async markLatestPracticeQuestion(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      testId: number;
      toeicQuestionId: number;
      selectedKey: string;
      isCorrect: boolean;
    },
  ): Promise<void> {
    const practiceRun = await tx.toeicRun.findFirst({
      where: {
        userId: input.userId,
        toeicTestId: input.testId,
        mode: ToeicRunMode.PRACTICE,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!practiceRun) {
      return;
    }

    const practiceQuestion = await tx.toeicRunQuestion.findUnique({
      where: {
        runId_toeicQuestionId: {
          runId: practiceRun.id,
          toeicQuestionId: input.toeicQuestionId,
        },
      },
    });

    if (
      !practiceQuestion ||
      practiceQuestion.status === ToeicRunQuestionStatus.RIGHT
    ) {
      return;
    }

    await tx.toeicRunQuestion.update({
      where: { id: practiceQuestion.id },
      data: {
        selectedKey: input.selectedKey,
        status: input.isCorrect
          ? ToeicRunQuestionStatus.RIGHT
          : ToeicRunQuestionStatus.WRONG,
        answeredAt: new Date(),
        gradedAt: new Date(),
      },
    });

    await this.refreshRunGroupStatus(tx, practiceQuestion.runGroupId);
    await this.recalculateRunTotals(tx, practiceRun.id);
  }

  private async refreshRunGroupStatus(
    tx: Prisma.TransactionClient,
    runGroupId: string,
  ): Promise<void> {
    const questions = await tx.toeicRunQuestion.findMany({
      where: { runGroupId },
      select: { status: true },
    });

    const status = questions.some(
      (question) => question.status === ToeicRunQuestionStatus.WRONG,
    )
      ? ToeicRunGroupStatus.WRONG
      : questions.length > 0 &&
          questions.every(
            (question) => question.status === ToeicRunQuestionStatus.RIGHT,
          )
        ? ToeicRunGroupStatus.RIGHT
        : null;

    await tx.toeicRunGroup.update({
      where: { id: runGroupId },
      data: { status },
    });
  }

  private async recalculateRunTotals(
    tx:
      | Pick<PrismaService, 'toeicRunQuestion' | 'toeicRun'>
      | Prisma.TransactionClient,
    runId: string,
  ): Promise<void> {
    const [totalRight, totalWrong] = await Promise.all([
      tx.toeicRunQuestion.count({
        where: { runId, status: ToeicRunQuestionStatus.RIGHT },
      }),
      tx.toeicRunQuestion.count({
        where: { runId, status: ToeicRunQuestionStatus.WRONG },
      }),
    ]);

    await tx.toeicRun.update({
      where: { id: runId },
      data: { totalRight, totalWrong },
    });
  }

  async finishRun(userId: string, sessionId: string) {
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
      await this.prisma.$transaction(async (tx) => {
        const questions = await tx.toeicRunQuestion.findMany({
          where: { runId: run.id },
          include: { toeicQuestion: true },
        });
        const now = new Date();
        const runGroupIds = new Set<string>();

        for (const question of questions) {
          runGroupIds.add(question.runGroupId);

          const answerKey = parseAnswerKey(question.toeicQuestion.answerKey);
          const selectedKey = question.selectedKey?.trim().toUpperCase();

          if (
            !answerKey ||
            !selectedKey ||
            !isToeicQuestionOptionKey(selectedKey)
          ) {
            continue;
          }

          await tx.toeicRunQuestion.update({
            where: { id: question.id },
            data: {
              selectedKey,
              status:
                selectedKey === answerKey
                  ? ToeicRunQuestionStatus.RIGHT
                  : ToeicRunQuestionStatus.WRONG,
              answeredAt: question.answeredAt ?? now,
              gradedAt: now,
            },
          });
        }

        for (const runGroupId of runGroupIds) {
          await this.refreshRunGroupStatus(tx, runGroupId);
        }

        await this.recalculateRunTotals(tx, run.id);
        await tx.toeicRun.update({
          where: { id: run.id },
          data: { completedAt: now },
        });
      });
    }

    const finishedRun = await this.getRunForResponse(run.id);
    if (!finishedRun) {
      throw new NotFoundException('TOEIC run not found.');
    }

    return this.formatSessionResponse(finishedRun);
  }

  async completeSession(userId: string, sessionId: string) {
    const run = await this.prisma.toeicRun.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!run) {
      throw new NotFoundException('Practice session not found.');
    }

    return {
      correctCount: run.totalRight,
      wrongCount: run.totalWrong,
    };
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
