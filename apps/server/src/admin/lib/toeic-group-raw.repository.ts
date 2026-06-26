import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const groupInclude = {
  testPart: {
    select: {
      testId: true,
      partNumber: true,
    },
  },
  questions: {
    orderBy: {
      questionNumber: 'asc' as const,
    },
  },
} satisfies Prisma.ToeicQuestionGroupInclude;

export type ToeicQuestionGroupRawRecord = Prisma.ToeicQuestionGroupGetPayload<{
  include: typeof groupInclude;
}>;

@Injectable()
export class ToeicGroupRawRepository {
  constructor(private readonly prisma: PrismaService) {}

  findGroupById(groupId: number): Promise<ToeicQuestionGroupRawRecord | null> {
    return this.prisma.toeicQuestionGroup.findUnique({
      where: { id: groupId },
      include: groupInclude,
    });
  }

  updateGroupRaw(
    groupId: number,
    groupData: {
      groupType: string | null;
      accent: string | null;
      content: string | null;
      contentVi: string | null;
    },
    questions: Array<{
      id: number;
      question: string | null;
      questionVi: string | null;
      questionType: string | null;
      optionA: string | null;
      optionB: string | null;
      optionC: string | null;
      optionD: string | null;
      optionAVi: string | null;
      optionBVi: string | null;
      optionCVi: string | null;
      optionDVi: string | null;
      answerKey: string | null;
      explanationVi: string | null;
    }>,
  ): Promise<ToeicQuestionGroupRawRecord> {
    return this.prisma.$transaction(async (tx) => {
      await tx.toeicQuestionGroup.update({
        where: { id: groupId },
        data: groupData,
      });

      await Promise.all(
        questions.map((question) =>
          tx.toeicQuestion.update({
            where: { id: question.id },
            data: {
              question: question.question,
              questionVi: question.questionVi,
              questionType: question.questionType,
              optionA: question.optionA,
              optionB: question.optionB,
              optionC: question.optionC,
              optionD: question.optionD,
              optionAVi: question.optionAVi,
              optionBVi: question.optionBVi,
              optionCVi: question.optionCVi,
              optionDVi: question.optionDVi,
              answerKey: question.answerKey,
              explanationVi: question.explanationVi,
            },
          }),
        ),
      );

      const updated = await tx.toeicQuestionGroup.findUnique({
        where: { id: groupId },
        include: groupInclude,
      });

      if (!updated) {
        throw new Error('Updated group not found');
      }

      return updated;
    });
  }
}
