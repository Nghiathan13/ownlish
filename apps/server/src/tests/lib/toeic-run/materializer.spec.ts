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
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    materializer = module.get(ToeicRunMaterializer);
  });

  it('creates a practice run inside the per-user/test lock', async () => {
    prismaMock.toeicRun.findFirst.mockResolvedValue(null);
    prismaMock.toeicRun.create.mockResolvedValue({ id: 'run-id' });

    await expect(
      materializer.findOrCreatePracticeRun({
        userId: 'user-1',
        testId: 1,
        selectedParts: [1],
      }),
    ).resolves.toEqual({ id: 'run-id' });

    expect(prismaMock.toeicRun.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        toeicTestId: 1,
        mode: ToeicRunMode.PRACTICE,
        selectedParts: [1],
      },
    });
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    expect(prismaMock.toeicQuestionGroup.findMany).not.toHaveBeenCalled();
    expect(prismaMock.toeicRunAnswer.create).not.toHaveBeenCalled();
  });

  it('unions new parts into an existing practice run', async () => {
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'run-id',
      mode: ToeicRunMode.PRACTICE,
      toeicTestId: 1,
      selectedParts: [1],
      totalRight: 0,
      totalWrong: 0,
      completedAt: null,
    });
    prismaMock.toeicRun.update.mockResolvedValue({ id: 'run-id' });

    await materializer.findOrCreatePracticeRun({
      userId: 'user-1',
      testId: 1,
      selectedParts: [2, 1],
    });

    expect(prismaMock.toeicRun.update).toHaveBeenCalledWith({
      where: { id: 'run-id' },
      data: { selectedParts: [1, 2] },
      select: {
        id: true,
        mode: true,
        toeicTestId: true,
        selectedParts: true,
        totalRight: true,
        totalWrong: true,
        completedAt: true,
      },
    });
  });

  it('does not write when all requested parts are already present', async () => {
    prismaMock.toeicRun.findFirst.mockResolvedValue({
      id: 'run-id',
      mode: ToeicRunMode.PRACTICE,
      toeicTestId: 1,
      selectedParts: [1, 2],
      totalRight: 0,
      totalWrong: 0,
      completedAt: null,
    });

    await materializer.findOrCreatePracticeRun({
      userId: 'user-1',
      testId: 1,
      selectedParts: [2],
    });

    expect(prismaMock.toeicRun.update).not.toHaveBeenCalled();
  });
});
