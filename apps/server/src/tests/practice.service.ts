import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ToeicPracticeMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  getOptionText,
  getOptionViText,
  isToeicQuestionOptionKey,
  parseAnswerKey,
} from './lib/toeic-question-mapper';
import { SubmitPracticeAnswerDto } from './dto/submit-practice-answer.dto';
import { CreatePracticeSessionDto } from './dto/create-practice-session.dto';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(userId: string, dto: CreatePracticeSessionDto) {
    const test = await this.prisma.toeicTest.findUnique({
      where: { id: dto.testId },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    const part = await this.prisma.toeicTestPart.findUnique({
      where: {
        testId_partNumber: {
          testId: dto.testId,
          partNumber: dto.partNumber,
        },
      },
    });

    if (!part) {
      throw new NotFoundException('Test part not found.');
    }

    const mode =
      dto.mode === 'wrong_questions'
        ? ToeicPracticeMode.WRONG_QUESTIONS
        : ToeicPracticeMode.NORMAL;

    if (mode === ToeicPracticeMode.WRONG_QUESTIONS) {
      const session = await this.prisma.toeicPracticeSession.create({
        data: {
          userId,
          toeicTestId: dto.testId,
          partNumber: dto.partNumber,
          mode,
        },
        include: {
          answers: {
            include: {
              toeicQuestion: {
                select: { answerKey: true },
              },
            },
          },
        },
      });

      return this.formatSessionResponse(session);
    }

    const existingSession = await this.prisma.toeicPracticeSession.findFirst({
      where: {
        userId,
        toeicTestId: dto.testId,
        partNumber: dto.partNumber,
        mode,
      },
      orderBy: { startedAt: 'desc' },
      include: {
        answers: {
          include: {
            toeicQuestion: {
              select: { answerKey: true },
            },
          },
        },
      },
    });

    if (existingSession) {
      if (existingSession.completedAt) {
        await this.prisma.toeicPracticeSession.update({
          where: { id: existingSession.id },
          data: { completedAt: null },
        });
      }

      return this.formatSessionResponse(existingSession);
    }

    const session = await this.prisma.toeicPracticeSession.create({
      data: {
        userId,
        toeicTestId: dto.testId,
        partNumber: dto.partNumber,
        mode,
      },
      include: {
        answers: {
          include: {
            toeicQuestion: {
              select: { answerKey: true },
            },
          },
        },
      },
    });

    return this.formatSessionResponse(session);
  }

  private formatSessionResponse(session: {
    id: string;
    correctCount: number;
    wrongCount: number;
    answers: Array<{
      toeicQuestionId: number;
      selectedKey: string;
      isCorrect: boolean;
      toeicQuestion: { answerKey: string | null };
    }>;
  }) {
    return {
      sessionId: session.id,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      answers: session.answers.flatMap((answer) => {
        const answerKey = parseAnswerKey(answer.toeicQuestion.answerKey);
        const selectedKey = answer.selectedKey.trim().toUpperCase();

        if (!answerKey || !isToeicQuestionOptionKey(selectedKey)) {
          return [];
        }

        return [
          {
            toeicQuestionId: answer.toeicQuestionId,
            selectedKey,
            answerKey,
            isCorrect: answer.isCorrect,
          },
        ];
      }),
    };
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitPracticeAnswerDto,
  ) {
    const session = await this.prisma.toeicPracticeSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
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

    if (
      !question ||
      question.group.testPart.testId !== session.toeicTestId ||
      question.group.testPart.partNumber !== session.partNumber
    ) {
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

    const existingAnswer = await this.prisma.toeicPracticeAnswer.findUnique({
      where: {
        sessionId_toeicQuestionId: {
          sessionId: session.id,
          toeicQuestionId: question.id,
        },
      },
    });

    if (existingAnswer) {
      if (existingAnswer.selectedKey === selectedKey) {
        return {
          isCorrect: existingAnswer.isCorrect,
          answerKey,
          correctOptionEn: getOptionText(question, answerKey),
          correctOptionVi: getOptionViText(question, answerKey),
        };
      }

      if (session.completedAt) {
        throw new ConflictException(
          'This question was already answered in this session.',
        );
      }

      const wasCorrect = existingAnswer.isCorrect;
      const isCorrect = selectedKey === answerKey;
      const isReviewMode = session.mode === ToeicPracticeMode.WRONG_QUESTIONS;

      await this.prisma.$transaction(async (tx) => {
        await tx.toeicPracticeAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            selectedKey,
            isCorrect,
          },
        });

        const correctDelta = (isCorrect ? 1 : 0) - (wasCorrect ? 1 : 0);
        const wrongDelta = !isReviewMode
          ? (isCorrect ? 0 : 1) - (wasCorrect ? 0 : 1)
          : 0;

        await tx.toeicPracticeSession.update({
          where: { id: session.id },
          data: {
            correctCount:
              correctDelta === 0 ? undefined : { increment: correctDelta },
            wrongCount:
              wrongDelta === 0 ? undefined : { increment: wrongDelta },
          },
        });

        if (isCorrect) {
          await tx.toeicWrongQuestion.deleteMany({
            where: {
              userId,
              toeicQuestionId: question.id,
            },
          });
        } else if (!isReviewMode && !wasCorrect) {
          await tx.toeicWrongQuestion.updateMany({
            where: {
              userId,
              toeicQuestionId: question.id,
            },
            data: {
              wrongCount: { increment: 1 },
              lastWrongAt: new Date(),
            },
          });
        } else if (!isReviewMode && wasCorrect && !isCorrect) {
          await tx.toeicWrongQuestion.upsert({
            where: {
              userId_toeicQuestionId: {
                userId,
                toeicQuestionId: question.id,
              },
            },
            create: {
              userId,
              toeicQuestionId: question.id,
            },
            update: {
              wrongCount: { increment: 1 },
              lastWrongAt: new Date(),
            },
          });
        }
      });

      return {
        isCorrect,
        answerKey,
        correctOptionEn: getOptionText(question, answerKey),
        correctOptionVi: getOptionViText(question, answerKey),
      };
    }

    const isCorrect = selectedKey === answerKey;
    const isReviewMode = session.mode === ToeicPracticeMode.WRONG_QUESTIONS;

    await this.prisma.$transaction(async (tx) => {
      await tx.toeicPracticeAnswer.create({
        data: {
          sessionId: session.id,
          toeicQuestionId: question.id,
          selectedKey,
          isCorrect,
        },
      });

      await tx.toeicPracticeSession.update({
        where: { id: session.id },
        data: {
          correctCount: isCorrect ? { increment: 1 } : undefined,
          wrongCount:
            !isReviewMode && !isCorrect ? { increment: 1 } : undefined,
        },
      });

      if (isCorrect) {
        await tx.toeicWrongQuestion.deleteMany({
          where: {
            userId,
            toeicQuestionId: question.id,
          },
        });
      } else if (!isReviewMode) {
        await tx.toeicWrongQuestion.upsert({
          where: {
            userId_toeicQuestionId: {
              userId,
              toeicQuestionId: question.id,
            },
          },
          create: {
            userId,
            toeicQuestionId: question.id,
          },
          update: {
            wrongCount: { increment: 1 },
            lastWrongAt: new Date(),
          },
        });
      }
    });

    const correctKey = answerKey;

    return {
      isCorrect,
      answerKey: correctKey,
      correctOptionEn: getOptionText(question, correctKey),
      correctOptionVi: getOptionViText(question, correctKey),
    };
  }

  async completeSession(userId: string, sessionId: string) {
    const session = await this.prisma.toeicPracticeSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Practice session not found.');
    }

    const updated = await this.prisma.toeicPracticeSession.update({
      where: { id: session.id },
      data: { completedAt: new Date() },
    });

    return {
      correctCount: updated.correctCount,
      wrongCount: updated.wrongCount,
    };
  }

  async clearTestHistory(userId: string, testId: number) {
    const test = await this.prisma.toeicTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    const [sessionResult] = await this.prisma.$transaction([
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

    return { deletedSessionCount: sessionResult.count };
  }

  async listWrongQuestions(userId: string, testId: number, partNumber: number) {
    await this.assertTestPartExists(testId, partNumber);

    const items = await this.prisma.toeicWrongQuestion.findMany({
      where: {
        userId,
        toeicQuestion: {
          group: {
            testPart: {
              testId,
              partNumber,
            },
          },
        },
      },
      include: {
        toeicQuestion: {
          select: {
            id: true,
            questionNumber: true,
          },
        },
      },
      orderBy: [{ lastWrongAt: 'desc' }, { toeicQuestionId: 'asc' }],
    });

    return {
      items: items.map((item) => ({
        toeicQuestionId: item.toeicQuestionId,
        questionNumber: item.toeicQuestion.questionNumber,
        wrongCount: item.wrongCount,
        lastWrongAt: item.lastWrongAt.toISOString(),
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

  private async getPracticeStatsForPart(
    userId: string,
    testId: number,
    partNumber: number,
  ) {
    const wrongQuestionCount = await this.prisma.toeicWrongQuestion.count({
      where: {
        userId,
        toeicQuestion: {
          group: {
            testPart: {
              testId,
              partNumber,
            },
          },
        },
      },
    });

    const aggregates = await this.prisma.toeicPracticeSession.aggregate({
      where: {
        userId,
        toeicTestId: testId,
        partNumber,
      },
      _sum: {
        correctCount: true,
        wrongCount: true,
      },
    });

    return {
      partNumber,
      wrongQuestionCount,
      practiceCorrectCount: aggregates._sum.correctCount ?? 0,
      practiceWrongCount: wrongQuestionCount,
    };
  }
}
