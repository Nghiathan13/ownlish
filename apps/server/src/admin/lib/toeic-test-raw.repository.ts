import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const testListInclude = {
  parts: {
    orderBy: { partNumber: 'asc' as const },
    include: {
      groups: {
        select: {
          _count: {
            select: { questions: true },
          },
        },
      },
    },
  },
} satisfies Prisma.ToeicTestInclude;

const testRawInclude = {
  parts: {
    orderBy: { partNumber: 'asc' as const },
    include: {
      groups: {
        orderBy: { questionStart: 'asc' as const },
        include: {
          questions: {
            orderBy: { questionNumber: 'asc' as const },
          },
        },
      },
    },
  },
} satisfies Prisma.ToeicTestInclude;

export type ToeicTestListRecord = Prisma.ToeicTestGetPayload<{
  include: typeof testListInclude;
}>;

export type ToeicTestRawRecord = Prisma.ToeicTestGetPayload<{
  include: typeof testRawInclude;
}>;

@Injectable()
export class ToeicTestRawRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTests(): Promise<ToeicTestListRecord[]> {
    return this.prisma.toeicTest.findMany({
      orderBy: [{ year: 'desc' }, { testNumber: 'asc' }],
      include: testListInclude,
    });
  }

  findTestById(testId: number): Promise<ToeicTestRawRecord | null> {
    return this.prisma.toeicTest.findUnique({
      where: { id: testId },
      include: testRawInclude,
    });
  }
}
