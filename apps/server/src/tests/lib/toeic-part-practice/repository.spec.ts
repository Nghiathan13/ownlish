import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { ToeicPartPracticeRepository } from './repository';
import {
  createToeicTestsPrismaMock,
  useToeicTestsTransaction,
} from '../../testing/create-toeic-tests-prisma.mock';

function createPartPracticePrismaMock() {
  const base = createToeicTestsPrismaMock();
  return {
    ...base,
    toeicPartPracticeRun: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    toeicPartPracticeQuestion: {
      updateMany: jest.fn(),
    },
    toeicPartPracticeGroup: {
      updateMany: jest.fn(),
    },
  };
}

describe('ToeicPartPracticeRepository', () => {
  let repository: ToeicPartPracticeRepository;
  const prismaMock = createPartPracticePrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    useToeicTestsTransaction(prismaMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicPartPracticeRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get(ToeicPartPracticeRepository);
  });

  it('clears aggregate answers without deleting the run', async () => {
    prismaMock.toeicPartPracticeRun.findUnique.mockResolvedValue({
      id: 'part-run-id',
    });

    await expect(
      repository.resetPartPracticeAnswers('user-id', 1),
    ).resolves.toBe(1);

    expect(
      prismaMock.toeicPartPracticeQuestion.updateMany,
    ).toHaveBeenCalledWith({
      where: { runId: 'part-run-id' },
      data: {
        selectedKey: null,
        status: null,
        answeredAt: null,
        gradedAt: null,
      },
    });
    expect(prismaMock.toeicPartPracticeGroup.updateMany).toHaveBeenCalledWith({
      where: { runId: 'part-run-id' },
      data: { status: null },
    });
    expect(prismaMock.toeicPartPracticeRun.update).toHaveBeenCalledWith({
      where: { id: 'part-run-id' },
      data: { totalRight: 0, totalWrong: 0 },
    });
    expect(prismaMock.toeicPartPracticeRun.deleteMany).toBeUndefined();
  });

  it('returns zero when no aggregate run exists', async () => {
    prismaMock.toeicPartPracticeRun.findUnique.mockResolvedValue(null);

    await expect(
      repository.resetPartPracticeAnswers('user-id', 1),
    ).resolves.toBe(0);
  });
});
