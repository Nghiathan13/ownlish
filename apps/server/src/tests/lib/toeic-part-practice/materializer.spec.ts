import { Test, TestingModule } from '@nestjs/testing';
import { ToeicPartPracticeMaterializer } from './materializer';
import { ToeicPartPracticeRepository } from './repository';
import { buildPartPracticeRunForResponse } from '../../testing/part-practice.fixtures';

describe('ToeicPartPracticeMaterializer', () => {
  let materializer: ToeicPartPracticeMaterializer;

  const repositoryMock = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicPartPracticeMaterializer,
        {
          provide: ToeicPartPracticeRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    materializer = module.get(ToeicPartPracticeMaterializer);
  });

  it('uses the user and part unique key to atomically get or create a run', async () => {
    const run = buildPartPracticeRunForResponse({ id: 'run-id' });
    const upsert = jest.fn().mockResolvedValue(run);

    repositoryMock.transaction.mockImplementation(
      async (
        callback: (tx: {
          toeicPartPracticeRun: { upsert: jest.Mock };
        }) => Promise<typeof run>,
      ) =>
        callback({
          toeicPartPracticeRun: {
            upsert,
          },
        }),
    );

    await expect(materializer.findOrCreateRun('user-id', 1)).resolves.toBe(run);

    expect(repositoryMock.transaction).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith({
      where: { userId_partNumber: { userId: 'user-id', partNumber: 1 } },
      create: { userId: 'user-id', partNumber: 1 },
      update: {},
    });
  });
});
