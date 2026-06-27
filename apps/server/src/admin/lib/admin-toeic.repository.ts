import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const groupEditableSelect = {
  id: true,
  groupType: true,
  accent: true,
  content: true,
  contentVi: true,
} satisfies Prisma.ToeicQuestionGroupSelect;

const questionEditableSelect = {
  id: true,
  question: true,
  questionVi: true,
  questionType: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  optionAVi: true,
  optionBVi: true,
  optionCVi: true,
  optionDVi: true,
  answerKey: true,
  explanationVi: true,
} satisfies Prisma.ToeicQuestionSelect;

export type AdminToeicGroupEditableRecord =
  Prisma.ToeicQuestionGroupGetPayload<{
    select: typeof groupEditableSelect;
  }>;

export type AdminToeicQuestionEditableRecord = Prisma.ToeicQuestionGetPayload<{
  select: typeof questionEditableSelect;
}>;

@Injectable()
export class AdminToeicRepository {
  constructor(private readonly prisma: PrismaService) {}

  findGroupById(
    groupId: number,
  ): Promise<AdminToeicGroupEditableRecord | null> {
    return this.prisma.toeicQuestionGroup.findUnique({
      where: { id: groupId },
      select: groupEditableSelect,
    });
  }

  updateGroupFields(
    groupId: number,
    data: Prisma.ToeicQuestionGroupUpdateInput,
  ): Promise<AdminToeicGroupEditableRecord> {
    return this.prisma.toeicQuestionGroup.update({
      where: { id: groupId },
      data,
      select: groupEditableSelect,
    });
  }

  findQuestionById(
    questionId: number,
  ): Promise<AdminToeicQuestionEditableRecord | null> {
    return this.prisma.toeicQuestion.findUnique({
      where: { id: questionId },
      select: questionEditableSelect,
    });
  }

  updateQuestionFields(
    questionId: number,
    data: Prisma.ToeicQuestionUpdateInput,
  ): Promise<AdminToeicQuestionEditableRecord> {
    return this.prisma.toeicQuestion.update({
      where: { id: questionId },
      data,
      select: questionEditableSelect,
    });
  }
}
