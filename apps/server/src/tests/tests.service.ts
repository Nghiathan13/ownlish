import { Injectable, NotFoundException } from '@nestjs/common';
import { ToeicRunMode, ToeicRunQuestionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TestsStorageService } from './tests-storage.service';
import { RefreshMediaDto } from './dto/refresh-media.dto';

@Injectable()
export class TestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: TestsStorageService,
  ) {}

  async listAvailableYears() {
    const rows = await this.prisma.toeicTest.groupBy({
      by: ['year'],
      orderBy: { year: 'desc' },
    });

    return {
      years: rows.map((row) => row.year),
    };
  }

  async listTests(userId: string, year: number) {
    const tests = await this.prisma.toeicTest.findMany({
      where: { year },
      orderBy: { testNumber: 'asc' },
      include: {
        parts: {
          orderBy: { partNumber: 'asc' },
          select: { partNumber: true },
        },
      },
    });
    const testIds = tests.map((test) => test.id);
    const practiceRuns = testIds.length
      ? await this.prisma.toeicRun.findMany({
          where: {
            userId,
            toeicTestId: { in: testIds },
            mode: ToeicRunMode.PRACTICE,
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, toeicTestId: true },
        })
      : [];
    const latestRunByTestId = new Map<number, string>();

    for (const run of practiceRuns) {
      if (!latestRunByTestId.has(run.toeicTestId)) {
        latestRunByTestId.set(run.toeicTestId, run.id);
      }
    }

    const latestRunIds = [...latestRunByTestId.values()];
    const progressAnswers = latestRunIds.length
      ? await this.prisma.toeicRunAnswer.findMany({
          where: {
            runId: { in: latestRunIds },
            status: {
              in: [ToeicRunQuestionStatus.RIGHT, ToeicRunQuestionStatus.WRONG],
            },
          },
          select: {
            runId: true,
            status: true,
            toeicQuestion: {
              select: {
                group: {
                  select: { testPart: { select: { partNumber: true } } },
                },
              },
            },
          },
        })
      : [];
    const progressCountByPart = new Map<string, number>();

    for (const answer of progressAnswers) {
      const key = `${answer.runId}:${answer.toeicQuestion.group.testPart.partNumber}:${answer.status}`;
      progressCountByPart.set(key, (progressCountByPart.get(key) ?? 0) + 1);
    }

    return {
      items: tests.map((test) => ({
        id: test.id,
        year: test.year,
        testNumber: test.testNumber,
        parts: test.parts.map((part) => {
          const runId = latestRunByTestId.get(test.id);

          return {
            partNumber: part.partNumber,
            partCorrectCount: runId
              ? (progressCountByPart.get(
                  `${runId}:${part.partNumber}:${ToeicRunQuestionStatus.RIGHT}`,
                ) ?? 0)
              : 0,
            partWrongCount: runId
              ? (progressCountByPart.get(
                  `${runId}:${part.partNumber}:${ToeicRunQuestionStatus.WRONG}`,
                ) ?? 0)
              : 0,
          };
        }),
      })),
    };
  }

  async refreshMedia(testId: number, partNumber: number, dto: RefreshMediaDto) {
    const part = await this.prisma.toeicTestPart.findUnique({
      where: {
        testId_partNumber: {
          testId,
          partNumber,
        },
      },
      include: {
        groups: {
          where: dto.groupIds?.length
            ? { id: { in: dto.groupIds } }
            : undefined,
          orderBy: { questionStart: 'asc' },
        },
      },
    });

    if (!part) {
      throw new NotFoundException('Test part not found.');
    }

    const storagePaths = part.groups.flatMap((group) => [
      group.audioStoragePath,
      group.imageStoragePath,
    ]);
    const signedUrls = await this.storageService.createSignedUrls(storagePaths);

    return {
      groups: part.groups.map((group) => {
        const audioSigned = group.audioStoragePath
          ? signedUrls.get(group.audioStoragePath)
          : null;
        const imageSigned = group.imageStoragePath
          ? signedUrls.get(group.imageStoragePath)
          : null;

        return {
          id: group.id,
          audioUrl: audioSigned?.url ?? null,
          audioUrlExpiresAt: audioSigned?.expiresAt ?? null,
          imageUrl: imageSigned?.url ?? null,
          imageUrlExpiresAt: imageSigned?.expiresAt ?? null,
        };
      }),
    };
  }
}
