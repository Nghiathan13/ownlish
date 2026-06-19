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
  getOptionText,
  getOptionViText,
  isToeicQuestionOptionKey,
  parseAnswerKey,
} from './lib/toeic-question-mapper';
import { SubmitPracticeAnswerDto } from './dto/submit-practice-answer.dto';
import { SubmitReviewGroupAnswersDto } from './dto/submit-review-group-answers.dto';
import { CreatePracticeSessionDto } from './dto/create-practice-session.dto';

const DEFERRED_GROUP_GRADING_PARTS = new Set([3, 4]);
const REVIEW_GROUP_BATCH_PARTS = new Set([3, 4, 6, 7]);

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

type RunForResponse = {
  id: string;
  totalRight: number;
  totalWrong: number;
  questions: RunQuestionForResponse[];
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
  constructor(private readonly prisma: PrismaService) {}

  async createSession(userId: string, dto: CreatePracticeSessionDto) {
    const selectedParts = this.resolveSelectedParts(dto);
    const mode =
      dto.mode === 'wrong_questions'
        ? ToeicRunMode.WRONG_REVIEW
        : ToeicRunMode.PRACTICE;

    await this.assertTestAndPartsExist(dto.testId, selectedParts);

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

  private resolveSelectedParts(dto: CreatePracticeSessionDto): number[] {
    const parts = dto.partNumbers ?? (dto.partNumber ? [dto.partNumber] : []);
    const selectedParts = [...new Set(parts)].sort((a, b) => a - b);

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
    } satisfies Prisma.ToeicRunInclude;
  }

  private formatSessionResponse(session: RunForResponse) {
    return {
      sessionId: session.id,
      correctCount: session.totalRight,
      wrongCount: session.totalWrong,
      answers: session.questions.flatMap((answer) => {
        const answerKey = parseAnswerKey(answer.toeicQuestion.answerKey);
        const selectedKey = answer.selectedKey?.trim().toUpperCase();

        if (
          !answerKey ||
          !selectedKey ||
          !isToeicQuestionOptionKey(selectedKey)
        ) {
          return [];
        }

        if (answer.status === ToeicRunQuestionStatus.SELECTED) {
          return [
            {
              toeicQuestionId: answer.toeicQuestionId,
              selectedKey,
            },
          ];
        }

        if (answer.status === ToeicRunQuestionStatus.RIGHT) {
          return [
            {
              toeicQuestionId: answer.toeicQuestionId,
              selectedKey,
              answerKey,
              isCorrect: true,
            },
          ];
        }

        if (answer.status === ToeicRunQuestionStatus.WRONG) {
          return [
            {
              toeicQuestionId: answer.toeicQuestionId,
              selectedKey,
              answerKey,
              isCorrect: false,
            },
          ];
        }

        return [];
      }),
    };
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

  private usesDeferredGroupGrading(partNumber: number, mode: ToeicRunMode) {
    return (
      mode === ToeicRunMode.PRACTICE &&
      DEFERRED_GROUP_GRADING_PARTS.has(partNumber)
    );
  }

  private usesReviewGroupBatchSubmit(partNumber: number, mode: ToeicRunMode) {
    return (
      mode === ToeicRunMode.WRONG_REVIEW &&
      REVIEW_GROUP_BATCH_PARTS.has(partNumber)
    );
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
    dto: SubmitPracticeAnswerDto,
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

    if (this.usesReviewGroupBatchSubmit(runQuestion.partNumber, run.mode)) {
      throw new BadRequestException(
        'Use the group answers endpoint for this part in review mode.',
      );
    }

    if (runQuestion.status === ToeicRunQuestionStatus.RIGHT) {
      return this.buildGradedResponse(question, answerKey, true);
    }

    const usesDeferredGrading = this.usesDeferredGroupGrading(
      runQuestion.partNumber,
      run.mode,
    );

    if (usesDeferredGrading) {
      return this.submitDeferredPracticeAnswer(
        userId,
        run,
        runQuestion,
        question,
        selectedKey,
        answerKey,
      );
    }

    const isCorrect = selectedKey === answerKey;

    await this.prisma.$transaction(async (tx) => {
      await this.gradeRunQuestion(tx, {
        run,
        runQuestion,
        selectedKey,
        isCorrect,
      });

      if (run.mode === ToeicRunMode.WRONG_REVIEW && isCorrect) {
        await this.markLatestPracticeQuestionRight(tx, {
          userId,
          testId: run.toeicTestId,
          toeicQuestionId: question.id,
          selectedKey,
        });
      }
    });

    return this.buildGradedResponse(question, answerKey, isCorrect);
  }

  private async submitDeferredPracticeAnswer(
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

      if (run.mode === ToeicRunMode.WRONG_REVIEW && isCorrect) {
        await this.markLatestPracticeQuestionRight(tx, {
          userId,
          testId: run.toeicTestId,
          toeicQuestionId: question.toeicQuestionId,
          selectedKey,
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

  private async markLatestPracticeQuestionRight(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      testId: number;
      toeicQuestionId: number;
      selectedKey: string;
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
        status: ToeicRunQuestionStatus.RIGHT,
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

  async submitReviewGroupAnswers(
    userId: string,
    sessionId: string,
    groupId: number,
    dto: SubmitReviewGroupAnswersDto,
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

    if (run.mode !== ToeicRunMode.WRONG_REVIEW) {
      throw new BadRequestException(
        'Group answers can only be submitted in review mode.',
      );
    }

    const runGroup = await this.prisma.toeicRunGroup.findFirst({
      where: {
        runId: run.id,
        toeicQuestionGroupId: groupId,
      },
      include: {
        questions: {
          include: { toeicQuestion: true },
        },
      },
    });

    if (!runGroup) {
      throw new BadRequestException(
        'Question group does not belong to this session.',
      );
    }

    if (!this.usesReviewGroupBatchSubmit(runGroup.partNumber, run.mode)) {
      throw new BadRequestException(
        'Group answers are only supported for parts 3, 4, 6, and 7 in review mode.',
      );
    }

    const submittedQuestionIds = new Set(
      dto.answers.map((item) => item.toeicQuestionId),
    );

    if (submittedQuestionIds.size !== dto.answers.length) {
      throw new BadRequestException('Duplicate questions in group submission.');
    }

    const editableQuestions = runGroup.questions.filter(
      (question) => question.status !== ToeicRunQuestionStatus.RIGHT,
    );
    const editableQuestionIds = editableQuestions.map(
      (question) => question.toeicQuestionId,
    );

    if (
      editableQuestionIds.length !== submittedQuestionIds.size ||
      !editableQuestionIds.every((id) => submittedQuestionIds.has(id))
    ) {
      throw new BadRequestException(
        'Submit answers for every wrong question in the group.',
      );
    }

    const questionsById = new Map(
      runGroup.questions.map((question) => [
        question.toeicQuestionId,
        question,
      ]),
    );
    const results: Array<SubmitAnswerResponse & { toeicQuestionId: number }> =
      [];

    await this.prisma.$transaction(async (tx) => {
      for (const answer of dto.answers) {
        const runQuestion = questionsById.get(answer.toeicQuestionId);
        if (!runQuestion) {
          continue;
        }

        const answerKey = parseAnswerKey(runQuestion.toeicQuestion.answerKey);
        const selectedKey = answer.selectedKey.trim().toUpperCase();

        if (!answerKey) {
          throw new BadRequestException('Question has an invalid answer key.');
        }

        if (!isToeicQuestionOptionKey(selectedKey)) {
          throw new BadRequestException('Invalid answer.');
        }

        const isCorrect = selectedKey === answerKey;

        await this.gradeRunQuestion(tx, {
          run,
          runQuestion,
          selectedKey,
          isCorrect,
        });

        if (isCorrect) {
          await this.markLatestPracticeQuestionRight(tx, {
            userId,
            testId: run.toeicTestId,
            toeicQuestionId: runQuestion.toeicQuestionId,
            selectedKey,
          });
        }

        results.push({
          toeicQuestionId: runQuestion.toeicQuestionId,
          ...this.buildGradedResponse(
            runQuestion.toeicQuestion,
            answerKey,
            isCorrect,
          ),
        });
      }
    });

    return { results };
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

    const [runResult, legacySessionResult] = await this.prisma.$transaction([
      this.prisma.toeicRun.deleteMany({
        where: {
          userId,
          toeicTestId: testId,
        },
      }),
      this.prisma.toeicPracticeSession.deleteMany({
        where: {
          userId,
          toeicTestId: testId,
        },
      }),
      this.prisma.toeicWrongQuestion.deleteMany({
        where: {
          userId,
          toeicQuestion: {
            group: {
              testPart: {
                testId,
              },
            },
          },
        },
      }),
    ]);

    return { deletedSessionCount: runResult.count + legacySessionResult.count };
  }

  async listWrongQuestions(userId: string, testId: number, partNumber: number) {
    await this.assertTestPartExists(testId, partNumber);

    const practiceRun = await this.findLatestPracticeRunForPart(userId, testId);

    if (!practiceRun) {
      return { items: [] };
    }

    const items = await this.prisma.toeicRunQuestion.findMany({
      where: {
        runId: practiceRun.id,
        partNumber,
        status: ToeicRunQuestionStatus.WRONG,
      },
      include: {
        toeicQuestion: {
          select: {
            id: true,
            questionNumber: true,
          },
        },
      },
      orderBy: [{ gradedAt: 'desc' }, { toeicQuestionId: 'asc' }],
    });

    return {
      items: items.map((item) => ({
        toeicQuestionId: item.toeicQuestionId,
        questionNumber: item.toeicQuestion.questionNumber,
        wrongCount: 1,
        lastWrongAt: (
          item.gradedAt ??
          item.answeredAt ??
          new Date()
        ).toISOString(),
      })),
    };
  }

  async getPracticeStats(userId: string, testId: number, partNumber?: number) {
    const test = await this.prisma.toeicTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    if (partNumber !== undefined) {
      await this.assertTestPartExists(testId, partNumber);
      const partStats = await this.getPracticeStatsForPart(
        userId,
        testId,
        partNumber,
      );

      return {
        testId,
        wrongQuestionCount: partStats.wrongQuestionCount,
        practiceCorrectCount: partStats.practiceCorrectCount,
        practiceWrongCount: partStats.practiceWrongCount,
        parts: [partStats],
      };
    }

    const parts = await this.prisma.toeicTestPart.findMany({
      where: { testId },
      orderBy: { partNumber: 'asc' },
      select: { partNumber: true },
    });

    const partStats = await Promise.all(
      parts.map((part) =>
        this.getPracticeStatsForPart(userId, testId, part.partNumber),
      ),
    );

    return {
      testId,
      wrongQuestionCount: partStats.reduce(
        (total, part) => total + part.wrongQuestionCount,
        0,
      ),
      practiceCorrectCount: partStats.reduce(
        (total, part) => total + part.practiceCorrectCount,
        0,
      ),
      practiceWrongCount: partStats.reduce(
        (total, part) => total + part.practiceWrongCount,
        0,
      ),
      parts: partStats,
    };
  }

  private async assertTestPartExists(testId: number, partNumber: number) {
    const part = await this.prisma.toeicTestPart.findUnique({
      where: {
        testId_partNumber: {
          testId,
          partNumber,
        },
      },
    });

    if (!part) {
      throw new NotFoundException('Test part not found.');
    }
  }

  private findLatestPracticeRunForPart(userId: string, testId: number) {
    return this.prisma.toeicRun.findFirst({
      where: {
        userId,
        toeicTestId: testId,
        mode: ToeicRunMode.PRACTICE,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
  }

  private async getPracticeStatsForPart(
    userId: string,
    testId: number,
    partNumber: number,
  ) {
    const practiceRun = await this.findLatestPracticeRunForPart(userId, testId);

    if (!practiceRun) {
      return {
        partNumber,
        wrongQuestionCount: 0,
        practiceCorrectCount: 0,
        practiceWrongCount: 0,
      };
    }

    const [practiceCorrectCount, practiceWrongCount] = await Promise.all([
      this.prisma.toeicRunQuestion.count({
        where: {
          runId: practiceRun.id,
          partNumber,
          status: ToeicRunQuestionStatus.RIGHT,
        },
      }),
      this.prisma.toeicRunQuestion.count({
        where: {
          runId: practiceRun.id,
          partNumber,
          status: ToeicRunQuestionStatus.WRONG,
        },
      }),
    ]);

    return {
      partNumber,
      wrongQuestionCount: practiceWrongCount,
      practiceCorrectCount,
      practiceWrongCount,
    };
  }
}
