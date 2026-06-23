import { Test, TestingModule } from '@nestjs/testing';
import { ToeicRunMode } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ToeicRunMaterializer } from './materializer';
import { ToeicRunRepository } from './repository';
import {
  createToeicTestsPrismaMock,
  useToeicTestsTransaction,
} from '../../testing/create-toeic-tests-prisma.mock';

describe('ToeicRunMaterializer', () => {
  let materializer: ToeicRunMaterializer;

  const prismaMock = createToeicTestsPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    useToeicTestsTransaction(prismaMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicRunMaterializer,
        ToeicRunRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    materializer = module.get(ToeicRunMaterializer);
  });

  it('creates a run with question groups and reloads the full session', async () => {
    prismaMock.toeicQuestionGroup.findMany.mockResolvedValue([
      {
        id: 101,
        questionStart: 1,
        questionEnd: 1,
        testPart: { partNumber: 1 },
        questions: [{ id: 1001, questionNumber: 1 }],
      },
    ]);
    prismaMock.toeicRun.create.mockResolvedValue({ id: 'run-id' });
    prismaMock.toeicRunGroup.create.mockResolvedValue({ id: 'group-id' });
    prismaMock.toeicRun.findUnique.mockResolvedValue({
      id: 'run-id',
      mode: ToeicRunMode.PRACTICE,
      toeicTestId: 1,
      selectedParts: [1],
      totalRight: 0,
      totalWrong: 0,
      completedAt: null,
      questions: [],
      groups: [],
    });

    const run = await materializer.createRunWithQuestions({
      userId: 'user-1',
      testId: 1,
      mode: ToeicRunMode.PRACTICE,
      selectedParts: [1],
    });

    expect(prismaMock.toeicRunGroup.create).toHaveBeenCalledWith({
      data: {
        runId: 'run-id',
        toeicQuestionGroupId: 101,
        partNumber: 1,
        questionStart: 1,
        questionEnd: 1,
        sortOrder: 0,
      },
    });
    expect(prismaMock.toeicRunQuestion.createMany).toHaveBeenCalledWith({
      data: [
        {
          runId: 'run-id',
          runGroupId: 'group-id',
          toeicQuestionId: 1001,
          partNumber: 1,
          questionNumber: 1,
          sortOrder: 1,
        },
      ],
    });
    expect(run.id).toBe('run-id');
  });

  it('expands an existing practice run without duplicating groups', async () => {
    prismaMock.toeicRun.findUnique.mockResolvedValue({
      id: 'run-id',
      selectedParts: [1],
      groups: [
        {
          toeicQuestionGroupId: 101,
          partNumber: 1,
          sortOrder: 0,
        },
      ],
    });
    prismaMock.toeicQuestionGroup.findMany.mockResolvedValue([
      {
        id: 101,
        questionStart: 1,
        questionEnd: 1,
        testPart: { partNumber: 1 },
        questions: [{ id: 1001, questionNumber: 1 }],
      },
      {
        id: 102,
        questionStart: 2,
        questionEnd: 2,
        testPart: { partNumber: 2 },
        questions: [{ id: 1002, questionNumber: 2 }],
      },
    ]);
    prismaMock.toeicRunGroup.create.mockResolvedValue({ id: 'group-id-2' });

    await materializer.ensurePracticeRunIncludesParts('run-id', 1, [2]);

    expect(prismaMock.toeicRunGroup.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.toeicRunGroup.create).toHaveBeenCalledWith({
      data: {
        runId: 'run-id',
        toeicQuestionGroupId: 102,
        partNumber: 2,
        questionStart: 2,
        questionEnd: 2,
        sortOrder: 1,
      },
    });
    expect(prismaMock.toeicRun.update).toHaveBeenCalledWith({
      where: { id: 'run-id' },
      data: { selectedParts: [1, 2] },
    });
  });

  it('finds the latest practice run for a user and test', async () => {
    prismaMock.toeicRun.findFirst.mockResolvedValue({ id: 'run-id' });

    await expect(
      materializer.findLatestPracticeRun('user-id', 1),
    ).resolves.toEqual({ id: 'run-id' });

    expect(prismaMock.toeicRun.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        toeicTestId: 1,
        mode: ToeicRunMode.PRACTICE,
      },
      orderBy: { createdAt: 'desc' },
      include: expect.any(Object) as unknown,
    });
  });
});
