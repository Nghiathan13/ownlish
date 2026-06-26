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
    countRunQuestions: jest.fn(),
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

  it('attaches only missing catalog groups to an existing run and returns refreshed run', async () => {
    const existingRun = buildPartPracticeRunForResponse({
      id: 'run-id',
      groups: [
        buildPartPracticePhotoRunGroup({
          toeicQuestionGroupId: 101,
          sortOrder: 0,
        }),
      ],
    });
    const catalogGroups = [
      buildCatalogGroup({ id: 101 }),
      buildCatalogGroup({
        id: 102,
        questions: [{ id: 1002, questionNumber: 1 }],
      }),
    ];
    const refreshedRun = buildPartPracticeRunForResponse({
      id: 'run-id',
      groups: [
        buildPartPracticePhotoRunGroup({
          toeicQuestionGroupId: 101,
          sortOrder: 0,
        }),
        buildPartPracticePhotoRunGroup({
          toeicQuestionGroupId: 102,
          sortOrder: 1,
          question: { id: 1002, questionNumber: 1 } as never,
        }),
      ],
    });
    const txMock = {
      toeicPartPracticeGroup: {
        create: jest.fn().mockResolvedValue({ id: 'new-group-id' }),
      },
      toeicPartPracticeQuestion: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    repositoryMock.findRunByUserAndPart.mockResolvedValue(existingRun);
    repositoryMock.listQuestionGroupsForPartCatalog.mockResolvedValue(
      catalogGroups,
    );
    repositoryMock.countRunQuestions.mockResolvedValue(1);
    repositoryMock.findRunForResponse.mockResolvedValue(refreshedRun);
    repositoryMock.transaction.mockImplementation(
      async (callback: (tx: typeof txMock) => Promise<void>) =>
        callback(txMock),
    );

    await expect(
      materializer.findOrCreateRunWithQuestions('user-id', 1),
    ).resolves.toBe(refreshedRun);

    expect(
      repositoryMock.listQuestionGroupsForPartCatalog,
    ).toHaveBeenCalledWith(1);
    expect(repositoryMock.transaction).toHaveBeenCalledTimes(1);
    expect(txMock.toeicPartPracticeGroup.create).toHaveBeenCalledTimes(1);
    expect(txMock.toeicPartPracticeGroup.create).toHaveBeenCalledWith({
      data: {
        runId: 'run-id',
        toeicQuestionGroupId: 102,
        toeicTestId: 1,
        partNumber: 1,
        questionStart: 1,
        questionEnd: 1,
        sortOrder: 1,
      },
    });
    expect(txMock.toeicPartPracticeQuestion.createMany).toHaveBeenCalledWith({
      data: [
        {
          runId: 'run-id',
          runGroupId: 'new-group-id',
          toeicQuestionId: 1002,
          toeicTestId: 1,
          partNumber: 1,
          questionNumber: 1,
          sortOrder: 2,
        },
      ],
    });
    expect(repositoryMock.findRunForResponse).toHaveBeenCalledWith('run-id');
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
