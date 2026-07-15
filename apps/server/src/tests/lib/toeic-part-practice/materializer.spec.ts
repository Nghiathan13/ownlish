import { Test, TestingModule } from '@nestjs/testing';
import { ToeicPartPracticeMaterializer } from './materializer';
import type { ToeicQuestionGroupForPartPractice } from './materializer.types';
import { ToeicPartPracticeRepository } from './repository';
import {
  buildPartPracticePhotoRunGroup,
  buildPartPracticeRunForResponse,
} from '../../testing/part-practice.fixtures';

function buildCatalogGroup(
  overrides: Partial<ToeicQuestionGroupForPartPractice> & { id: number },
): ToeicQuestionGroupForPartPractice {
  return {
    questionStart: 1,
    questionEnd: 1,
    testPart: {
      partNumber: 1,
      testId: 1,
      test: {
        year: 2026,
        testNumber: 1,
      },
    },
    questions: [{ id: overrides.id * 10, questionNumber: 1 }],
    ...overrides,
  };
}

describe('ToeicPartPracticeMaterializer', () => {
  let materializer: ToeicPartPracticeMaterializer;

  const repositoryMock = {
    findRunByUserAndPart: jest.fn(),
    listQuestionGroupsForPartCatalog: jest.fn(),
    transaction: jest.fn(),
    findRunForResponse: jest.fn(),
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

  it('returns an existing run without syncing catalog groups', async () => {
    const existingRun = buildPartPracticeRunForResponse({
      id: 'run-id',
      groups: [
        buildPartPracticePhotoRunGroup({
          toeicQuestionGroupId: 101,
          sortOrder: 0,
        }),
      ],
    });

    repositoryMock.findRunByUserAndPart.mockResolvedValue(existingRun);

    await expect(
      materializer.findOrCreateRunWithQuestions('user-id', 1),
    ).resolves.toBe(existingRun);

    expect(repositoryMock.findRunByUserAndPart).toHaveBeenCalledWith(
      'user-id',
      1,
    );
    expect(
      repositoryMock.listQuestionGroupsForPartCatalog,
    ).not.toHaveBeenCalled();
    expect(repositoryMock.transaction).not.toHaveBeenCalled();
    expect(repositoryMock.findRunForResponse).not.toHaveBeenCalled();
  });

  it('creates a new run when none exists for the user and part', async () => {
    const catalogGroups = [buildCatalogGroup({ id: 101 })];
    const createdRun = buildPartPracticeRunForResponse({ id: 'new-run-id' });
    const txMock = {
      toeicPartPracticeRun: {
        create: jest.fn().mockResolvedValue({ id: 'new-run-id' }),
      },
      toeicPartPracticeGroup: {
        create: jest.fn().mockResolvedValue({ id: 'group-id' }),
      },
      toeicPartPracticeQuestion: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    repositoryMock.findRunByUserAndPart.mockResolvedValue(null);
    repositoryMock.listQuestionGroupsForPartCatalog.mockResolvedValue(
      catalogGroups,
    );
    repositoryMock.findRunForResponse.mockResolvedValue(createdRun);
    repositoryMock.transaction.mockImplementation(
      async (callback: (tx: typeof txMock) => Promise<{ id: string }>) =>
        callback(txMock),
    );

    await expect(
      materializer.findOrCreateRunWithQuestions('user-id', 1),
    ).resolves.toBe(createdRun);

    expect(txMock.toeicPartPracticeRun.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        partNumber: 1,
      },
    });
    expect(repositoryMock.findRunForResponse).toHaveBeenCalledWith(
      'new-run-id',
    );
  });
});
