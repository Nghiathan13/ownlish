import { NotFoundException } from '@nestjs/common';
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

    await expect(
      repository.assertTestAndPartsExist(1, [1, 3]),
    ).rejects.toThrow('Test part not found.');
  });

  it('deletes all runs for a user and test', async () => {
    prismaMock.toeicRun.deleteMany.mockResolvedValue({ count: 3 });

    await expect(
      repository.deleteRunsForUserAndTest('user-id', 1),
    ).resolves.toBe(3);
  });
});
