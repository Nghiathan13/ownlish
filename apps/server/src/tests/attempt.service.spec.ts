import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AttemptService } from './attempt.service';

describe('AttemptService', () => {
  let service: AttemptService;

  const prismaMock = {
    toeicTest: {
      findUnique: jest.fn(),
    },
    toeicTestAttempt: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    toeicTestAttemptPart: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const sampleAttempt = {
    id: 'attempt-id',
    userId: 'user-id',
    toeicTestId: 1,
    startedAt: new Date('2026-06-01T00:00:00.000Z'),
    completedAt: null,
    totalCorrect: 0,
    totalWrong: 0,
    toeicTest: {
      id: 1,
      year: 2026,
      testNumber: 1,
    },
    test: {
      id: 1,
      year: 2026,
      testNumber: 1,
    },
    parts: Array.from({ length: 7 }, (_, index) => ({
      id: `part-${index + 1}`,
      partNumber: index + 1,
      correctCount: 0,
      wrongCount: 0,
      completedAt: null,
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AttemptService>(AttemptService);
  });

  it('resumes an in-progress attempt for the same test', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicTestAttempt.findFirst.mockResolvedValue(sampleAttempt);

    await expect(
      service.createAttempt('user-id', { testId: 1 }),
    ).resolves.toMatchObject({
      attemptId: 'attempt-id',
      currentPartNumber: 1,
    });
    expect(prismaMock.toeicTestAttempt.create).not.toHaveBeenCalled();
  });

  it('creates a new attempt when none is in progress', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.toeicTestAttempt.findFirst.mockResolvedValue(null);
    prismaMock.toeicTestAttempt.create.mockResolvedValue(sampleAttempt);

    await expect(
      service.createAttempt('user-id', { testId: 1 }),
    ).resolves.toMatchObject({
      attemptId: 'attempt-id',
      currentPartNumber: 1,
    });
    expect(prismaMock.toeicTestAttempt.create).toHaveBeenCalled();
  });

  it('throws when creating an attempt for a missing test', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue(null);

    await expect(
      service.createAttempt('user-id', { testId: 99 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists attempts for a user', async () => {
    prismaMock.$transaction.mockResolvedValue([[sampleAttempt], 1]);

    await expect(
      service.listAttempts('user-id', 1, 10, 0),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        expect.objectContaining({
          attemptId: 'attempt-id',
          testLabel: 'Test 1',
        }),
      ],
    });
  });
});
