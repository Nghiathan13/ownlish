import { Prisma } from '@prisma/client';

export function partPracticeRunResponseInclude() {
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
        test: {
          select: {
            year: true,
            testNumber: true,
          },
        },
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
  } satisfies Prisma.ToeicPartPracticeRunInclude;
}
