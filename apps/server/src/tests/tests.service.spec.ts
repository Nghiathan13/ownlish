import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TestsStorageService } from './tests-storage.service';
import { TestsService } from './tests.service';

describe('TestsService', () => {
  let service: TestsService;

  const prismaMock = {
    toeicTest: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    toeicTestPart: {
      findUnique: jest.fn(),
    },
    toeicRun: {
      findMany: jest.fn(),
    },
    toeicRunAnswer: {
      findMany: jest.fn(),
    },
  };

  const storageMock = {
    createSignedUrls: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TestsStorageService, useValue: storageMock },
      ],
    }).compile();

    service = module.get<TestsService>(TestsService);
  });

  it('lists tests with latest practice progress per part', async () => {
    prismaMock.toeicTest.findMany.mockResolvedValue([
      {
        id: 1,
        year: 2026,
        testNumber: 1,
        parts: [{ partNumber: 1 }, { partNumber: 2 }],
      },
    ]);
    prismaMock.toeicRun.findMany.mockResolvedValue([
      { id: 'latest-run', toeicTestId: 1 },
      { id: 'older-run', toeicTestId: 1 },
    ]);
    prismaMock.toeicRunAnswer.findMany.mockResolvedValue([
      ...Array.from({ length: 4 }, () => ({
        runId: 'latest-run',
        status: 'RIGHT',
        toeicQuestion: { group: { testPart: { partNumber: 1 } } },
      })),
      ...Array.from({ length: 2 }, () => ({
        runId: 'latest-run',
        status: 'WRONG',
        toeicQuestion: { group: { testPart: { partNumber: 1 } } },
      })),
      {
        runId: 'latest-run',
        status: 'WRONG',
        toeicQuestion: { group: { testPart: { partNumber: 2 } } },
      },
    ]);

    await expect(service.listTests('user-id', 2026)).resolves.toEqual({
      items: [
        {
          id: 1,
          year: 2026,
          testNumber: 1,
          parts: [
            { partNumber: 1, partCorrectCount: 4, partWrongCount: 2 },
            { partNumber: 2, partCorrectCount: 0, partWrongCount: 1 },
          ],
        },
      ],
    });
  });

  it('lists available test years in descending order', async () => {
    prismaMock.toeicTest.groupBy.mockResolvedValue([
      { year: 2026 },
      { year: 2025 },
    ]);

    await expect(service.listAvailableYears()).resolves.toEqual({
      years: [2026, 2025],
    });
  });
});
