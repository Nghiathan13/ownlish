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

    const session = await this.prisma.toeicPracticeSession.create({
      data: {
        userId,
        toeicTestId: dto.testId,
        partNumber: dto.partNumber,
        mode,
      },
    });

    return { sessionId: session.id };
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
        completedAt: null,
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
      throw new BadRequestException('Question does not belong to this session.');
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
      throw new ConflictException(
        'This question was already answered in this session.',
      );
    }

    const isCorrect = selectedKey === answerKey;

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
          correctCount: isCorrect
            ? { increment: 1 }
            : undefined,
          wrongCount: isCorrect ? undefined : { increment: 1 },
        },
      });

      if (isCorrect) {
        await tx.toeicWrongQuestion.deleteMany({
          where: {
            userId,
            toeicQuestionId: question.id,
          },
        });
      } else {
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
        completedAt: null,
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
}
