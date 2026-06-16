import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { countOptions, mapQuestionOptions } from './lib/toeic-question-mapper';
import { TestsStorageService } from './tests-storage.service';
import { RefreshMediaDto } from './dto/refresh-media.dto';

@Injectable()
export class TestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: TestsStorageService,
  ) {}

  async listTests(year: number) {
    const tests = await this.prisma.toeicTest.findMany({
      where: { year },
      orderBy: { testNumber: 'asc' },
    });

    return {
      items: tests.map((test) => ({
        id: test.id,
        year: test.year,
        testNumber: test.testNumber,
        label: `Test ${test.testNumber}`,
      })),
    };
  }

  async getPart(testId: number, partNumber: number) {
    const part = await this.prisma.toeicTestPart.findUnique({
      where: {
        testId_partNumber: {
          testId,
          partNumber,
        },
      },
      include: {
        test: true,
        groups: {
          orderBy: { questionStart: 'asc' },
          include: {
            questions: {
              orderBy: { questionNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!part) {
      throw new NotFoundException('Test part not found.');
    }

    const skill = partNumber <= 4 ? 'listening' : 'reading';
    const storagePaths = part.groups.flatMap((group) => [
      group.audioStoragePath,
      group.imageStoragePath,
    ]);
    const signedUrls = await this.storageService.createSignedUrls(storagePaths);

    return {
      testId: part.testId,
      partNumber: part.partNumber,
      skill,
      groups: part.groups.map((group) => {
        const audioSigned = group.audioStoragePath
          ? signedUrls.get(group.audioStoragePath)
          : null;
        const imageSigned = group.imageStoragePath
          ? signedUrls.get(group.imageStoragePath)
          : null;

        return {
          id: group.id,
          questionStart: group.questionStart,
          questionEnd: group.questionEnd,
          groupType: group.groupType,
          accent: group.accent,
          content: group.content,
          contentVi: group.contentVi,
          audioUrl: audioSigned?.url ?? null,
          audioUrlExpiresAt: audioSigned?.expiresAt ?? null,
          imageUrl: imageSigned?.url ?? null,
          imageUrlExpiresAt: imageSigned?.expiresAt ?? null,
          questions: group.questions.map((question) => ({
            id: question.id,
            questionNumber: question.questionNumber,
            question: question.question,
            questionVi: question.questionVi,
            options: mapQuestionOptions(question),
            optionCount: countOptions(question),
          })),
        };
      }),
    };
  }

  async refreshMedia(
    testId: number,
    partNumber: number,
    dto: RefreshMediaDto,
  ) {
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
