import { NotFoundException } from '@nestjs/common';
import { ToeicRunMode } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { ToeicRunRepository } from './repository';
import {
  createToeicTestsPrismaMock,
  useToeicTestsTransaction,
} from '../../testing/create-toeic-tests-prisma.mock';

describe('ToeicRunRepository', () => {
  let repository: ToeicRunRepository;

  const prismaMock = createToeicTestsPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    useToeicTestsTransaction(prismaMock);
    prismaMock.$queryRaw.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicRunRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get(ToeicRunRepository);
  });

  it('loads test year or throws when the test is missing', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ year: 2026 });

    await expect(repository.getTestYear(1)).resolves.toBe(2026);

    prismaMock.toeicTest.findUnique.mockResolvedValue(null);

    await expect(repository.getTestYear(99)).rejects.toThrow(NotFoundException);
  });

  it('asserts that every requested part exists on the test', async () => {
    prismaMock.toeicTest.findUnique.mockResolvedValue({ id: 1, year: 2026 });
    prismaMock.toeicTestPart.findMany.mockResolvedValue([
      { partNumber: 1 },
      { partNumber: 2 },
    ]);

    await expect(
      repository.assertTestAndPartsExist(1, [1, 2]),
    ).resolves.toBeUndefined();

    await expect(repository.assertTestAndPartsExist(1, [1, 3])).rejects.toThrow(
      'Test part not found.',
    );
  });

  it('clears practice answer history without deleting runs', async () => {
    prismaMock.toeicRun.findMany.mockResolvedValue([
      { id: 'run-b' },
      { id: 'run-a' },
    ]);

    await expect(
      repository.resetPracticeRunAnswers('user-id', 1),
    ).resolves.toBe(2);

    expect(prismaMock.toeicRun.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        toeicTestId: 1,
        mode: ToeicRunMode.PRACTICE,
      },
      select: { id: true },
    });
    expect(prismaMock.toeicRunAnswer.deleteMany).toHaveBeenCalledWith({
      where: { runId: { in: ['run-a', 'run-b'] } },
    });
    expect(prismaMock.toeicRun.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['run-a', 'run-b'] } },
      data: {
        totalRight: 0,
        totalWrong: 0,
      },
    });
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prismaMock.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      prismaMock.toeicRunAnswer.deleteMany.mock.invocationCallOrder[0],
    );
    const [[lockQuery]] = prismaMock.$queryRaw.mock.calls as Array<
      [{ sql: string; values: unknown[] }]
    >;
    expect(lockQuery.sql).toContain('FROM "toeic_runs"');
    expect(lockQuery.sql).toContain('ORDER BY "id"');
    expect(lockQuery.sql).toContain('FOR UPDATE');
    expect(lockQuery.values).toEqual(['run-a', 'run-b']);
    expect(prismaMock.toeicRun.deleteMany).not.toHaveBeenCalled();
  });

  it('returns zero when no practice run exists to reset', async () => {
    prismaMock.toeicRun.findMany.mockResolvedValue([]);

    await expect(
      repository.resetPracticeRunAnswers('user-id', 1),
    ).resolves.toBe(0);
  });
});
