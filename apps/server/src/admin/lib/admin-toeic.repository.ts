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

const groupMediaSelect = {
  id: true,
  imageStoragePath: true,
} satisfies Prisma.ToeicQuestionGroupSelect;

const groupImageUploadSelect = {
  id: true,
  imageStoragePath: true,
  questionStart: true,
  questionEnd: true,
  testPart: {
    select: {
      partNumber: true,
      test: {
        select: {
          testNumber: true,
        },
      },
    },
  },
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

export type AdminToeicGroupMediaRecord = Prisma.ToeicQuestionGroupGetPayload<{
  select: typeof groupMediaSelect;
}>;

export type AdminToeicGroupImageUploadRecord =
  Prisma.ToeicQuestionGroupGetPayload<{
    select: typeof groupImageUploadSelect;
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

  findGroupMediaById(
    groupId: number,
  ): Promise<AdminToeicGroupMediaRecord | null> {
    return this.prisma.toeicQuestionGroup.findUnique({
      where: { id: groupId },
      select: groupMediaSelect,
    });
  }

  findGroupImageUploadById(
    groupId: number,
  ): Promise<AdminToeicGroupImageUploadRecord | null> {
    return this.prisma.toeicQuestionGroup.findUnique({
      where: { id: groupId },
      select: groupImageUploadSelect,
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

  clearGroupImagePath(groupId: number): Promise<AdminToeicGroupMediaRecord> {
    return this.prisma.toeicQuestionGroup.update({
      where: { id: groupId },
      data: { imageStoragePath: null },
      select: groupMediaSelect,
    });
  }

  setGroupImagePath(
    groupId: number,
    imageStoragePath: string,
  ): Promise<AdminToeicGroupMediaRecord> {
    return this.prisma.toeicQuestionGroup.update({
      where: { id: groupId },
      data: { imageStoragePath },
      select: groupMediaSelect,
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
