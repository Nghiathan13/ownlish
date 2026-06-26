import { Test, TestingModule } from '@nestjs/testing';
import {
  ToeicRunGroupStatus,
  ToeicRunMode,
  ToeicRunQuestionStatus,
} from '@prisma/client';
import { getMockCallArg } from '../testing/jest-mock-call';
import { ToeicRunService } from './toeic-run.service';
import { ToeicRunGrader } from './lib/toeic-run/grader';
import { ToeicRunMaterializer } from './lib/toeic-run/materializer';
import { ToeicRunRepository } from './lib/toeic-run/repository';
import { ToeicRunSessionMapper } from './lib/toeic-run/session.mapper';
import type { FormatToeicSessionResponseOptions } from './lib/toeic-run/session.types';
import {
  buildToeicRunForResponse,
  buildPhotoRunGroup,
} from './testing/toeic-run.fixtures';

describe('ToeicRunService', () => {
  let service: ToeicRunService;

  const runRepositoryMock = {
    assertTestAndPartsExist: jest.fn(),
    getTestYear: jest.fn(),
    findOwnedRunMeta: jest.fn(),
    findOwnedRun: jest.fn(),
    findTestById: jest.fn(),
    resetPracticeRunAnswers: jest.fn(),
  };
  const runMaterializerMock = {
    findLatestPracticeRun: jest.fn(),
    ensurePracticeRunIncludesParts: jest.fn(),
    createRunWithQuestions: jest.fn(),
    findRunForResponse: jest.fn(),
  };
  const sessionMapperMock = {
    formatSessionResponse: jest.fn(),
  };
  const runGraderMock = {
    submitAnswer: jest.fn(),
    completeMockRun: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    runRepositoryMock.assertTestAndPartsExist.mockResolvedValue(undefined);
    runRepositoryMock.getTestYear.mockResolvedValue(2026);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToeicRunService,
        { provide: ToeicRunRepository, useValue: runRepositoryMock },
        { provide: ToeicRunMaterializer, useValue: runMaterializerMock },
        { provide: ToeicRunSessionMapper, useValue: sessionMapperMock },
        { provide: ToeicRunGrader, useValue: runGraderMock },
      ],
    }).compile();

    service = module.get(ToeicRunService);
  });

  it('reuses the latest practice run when creating a practice session', async () => {
    const existingRun = buildToeicRunForResponse({ id: 'run-id' });
    const refreshedRun = buildToeicRunForResponse({
      id: 'run-id',
      selectedParts: [1, 2],
    });
    const formattedResponse = { sessionId: 'run-id', mode: 'practice' };

    runMaterializerMock.findLatestPracticeRun.mockResolvedValue(existingRun);
    runMaterializerMock.findRunForResponse.mockResolvedValue(refreshedRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(
      formattedResponse,
    );

    await expect(
      service.createRun('user-id', { testId: 1, partNumbers: [1, 2] }),
    ).resolves.toBe(formattedResponse);

    expect(runMaterializerMock.findLatestPracticeRun).toHaveBeenCalledWith(
      'user-id',
      1,
    );
    expect(
      runMaterializerMock.ensurePracticeRunIncludesParts,
    ).toHaveBeenCalledWith('run-id', 1, [1, 2]);
    expect(runMaterializerMock.createRunWithQuestions).not.toHaveBeenCalled();
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      refreshedRun,
      [1, 2],
      { year: 2026 },
    );
  });

  it('creates a new practice run when none exists', async () => {
    const createdRun = buildToeicRunForResponse({ id: 'new-run-id' });
    const formattedResponse = { sessionId: 'new-run-id', mode: 'practice' };

    runMaterializerMock.findLatestPracticeRun.mockResolvedValue(null);
    runMaterializerMock.createRunWithQuestions.mockResolvedValue(createdRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(
      formattedResponse,
    );

    await expect(
      service.createRun('user-id', { testId: 1, partNumbers: [1] }),
    ).resolves.toBe(formattedResponse);

    expect(runMaterializerMock.createRunWithQuestions).toHaveBeenCalledWith({
      userId: 'user-id',
      testId: 1,
      mode: ToeicRunMode.PRACTICE,
      selectedParts: [1],
    });
  });

  it('creates a review wrong session from the shared practice run', async () => {
    const existingRun = buildToeicRunForResponse({ id: 'practice-run-id' });
    const refreshedRun = buildToeicRunForResponse({
      id: 'practice-run-id',
      totalRight: 1,
      totalWrong: 1,
    });
    const formattedResponse = {
      sessionId: 'practice-run-id',
      mode: 'review_wrong',
    };

    runMaterializerMock.findLatestPracticeRun.mockResolvedValue(existingRun);
    runMaterializerMock.findRunForResponse.mockResolvedValue(refreshedRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(
      formattedResponse,
    );

    await expect(
      service.createRun('user-id', {
        testId: 1,
        partNumbers: [1],
        mode: 'review_wrong',
      }),
    ).resolves.toBe(formattedResponse);

    expect(runMaterializerMock.createRunWithQuestions).not.toHaveBeenCalled();
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      refreshedRun,
      [1],
      {
        year: 2026,
        mode: 'review_wrong',
        groupFilter: expect.any(Function) as (group: unknown) => boolean,
      },
    );
    const reviewFormatOptions =
      getMockCallArg<FormatToeicSessionResponseOptions>(
        sessionMapperMock.formatSessionResponse,
        0,
        2,
      );
    expect(
      reviewFormatOptions.groupFilter?.(
        buildPhotoRunGroup({ status: ToeicRunGroupStatus.WRONG }),
      ),
    ).toBe(true);
  });

  it('creates a practice run before formatting review wrong when no session exists', async () => {
    const createdRun = buildToeicRunForResponse({ id: 'practice-run-id' });
    const formattedResponse = {
      sessionId: 'practice-run-id',
      mode: 'review_wrong',
      totalQuestions: 0,
      groups: [],
    };

    runMaterializerMock.findLatestPracticeRun.mockResolvedValue(null);
    runMaterializerMock.createRunWithQuestions.mockResolvedValue(createdRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(
      formattedResponse,
    );

    await expect(
      service.createRun('user-id', {
        testId: 1,
        partNumbers: [1],
        mode: 'review_wrong',
      }),
    ).resolves.toBe(formattedResponse);

    expect(runMaterializerMock.createRunWithQuestions).toHaveBeenCalledWith({
      userId: 'user-id',
      testId: 1,
      mode: ToeicRunMode.PRACTICE,
      selectedParts: [1],
    });
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      createdRun,
      [1],
      {
        year: 2026,
        mode: 'review_wrong',
        groupFilter: expect.any(Function) as (group: unknown) => boolean,
      },
    );
  });

  it('always creates a new mock test run', async () => {
    const createdRun = buildToeicRunForResponse({
      id: 'mock-run-id',
      mode: ToeicRunMode.MOCK_TEST,
    });
    const formattedResponse = {
      sessionId: 'mock-run-id',
      mode: 'mock_test',
      completedAt: null,
    };

    runMaterializerMock.createRunWithQuestions.mockResolvedValue(createdRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(
      formattedResponse,
    );

    await expect(
      service.createRun('user-id', {
        testId: 1,
        partNumbers: [1],
        mode: 'mock_test',
      }),
    ).resolves.toBe(formattedResponse);

    expect(runMaterializerMock.findLatestPracticeRun).not.toHaveBeenCalled();
    expect(runMaterializerMock.createRunWithQuestions).toHaveBeenCalledWith({
      userId: 'user-id',
      testId: 1,
      mode: ToeicRunMode.MOCK_TEST,
      selectedParts: [1],
    });
  });

  it('delegates answer submission to the grader', async () => {
    const dto = { toeicQuestionId: 1001, selectedKey: 'B' };
    runGraderMock.submitAnswer.mockResolvedValue({ graded: false });

    await expect(
      service.submitAnswer('user-id', 'mock-run-id', dto),
    ).resolves.toEqual({ graded: false });

    expect(runGraderMock.submitAnswer).toHaveBeenCalledWith(
      'user-id',
      'mock-run-id',
      dto,
    );
  });

  it('finishes mock runs through the grader and session mapper', async () => {
    const finishedRun = buildToeicRunForResponse({
      id: 'mock-run-id',
      mode: ToeicRunMode.MOCK_TEST,
      totalWrong: 2,
      completedAt: new Date('2026-06-21T00:00:00.000Z'),
    });
    const formattedResponse = {
      sessionId: 'mock-run-id',
      mode: 'mock_test',
      wrongCount: 2,
    };

    runRepositoryMock.findOwnedRun.mockResolvedValue({
      id: 'mock-run-id',
      mode: ToeicRunMode.MOCK_TEST,
      toeicTestId: 1,
      selectedParts: [1],
      completedAt: null,
    });
    runMaterializerMock.findRunForResponse.mockResolvedValue(finishedRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(
      formattedResponse,
    );

    await expect(service.finishRun('user-id', 'mock-run-id')).resolves.toBe(
      formattedResponse,
    );

    expect(runGraderMock.completeMockRun).toHaveBeenCalledWith('mock-run-id');
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      finishedRun,
      [1],
      { year: 2026 },
    );
  });

  it('skips mock completion when the run is already finished', async () => {
    const finishedRun = buildToeicRunForResponse({
      id: 'mock-run-id',
      mode: ToeicRunMode.MOCK_TEST,
      completedAt: new Date('2026-06-21T00:00:00.000Z'),
    });

    runRepositoryMock.findOwnedRun.mockResolvedValue({
      id: 'mock-run-id',
      mode: ToeicRunMode.MOCK_TEST,
      toeicTestId: 1,
      selectedParts: [1],
      completedAt: finishedRun.completedAt,
    });
    runMaterializerMock.findRunForResponse.mockResolvedValue(finishedRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue({
      sessionId: 'mock-run-id',
    });

    await service.finishRun('user-id', 'mock-run-id');

    expect(runGraderMock.completeMockRun).not.toHaveBeenCalled();
  });

  it('clears practice answer history for a test', async () => {
    runRepositoryMock.findTestById.mockResolvedValue({ id: 1, year: 2026 });
    runRepositoryMock.resetPracticeRunAnswers.mockResolvedValue(1);

    await expect(service.clearTestHistory('user-id', 1)).resolves.toEqual({
      deletedSessionCount: 1,
    });

    expect(runRepositoryMock.resetPracticeRunAnswers).toHaveBeenCalledWith(
      'user-id',
      1,
    );
  });

  it('getRun filters practice sessions without mutating stored parts', async () => {
    const loadedRun = {
      id: 'practice-run-id',
      mode: ToeicRunMode.PRACTICE,
      toeicTestId: 1,
      selectedParts: [1],
    };
    const refreshedRun = buildToeicRunForResponse({
      id: 'practice-run-id',
      selectedParts: [1],
    });
    const formattedResponse = {
      sessionId: 'practice-run-id',
      partNumbers: [1],
      year: 2026,
    };

    runRepositoryMock.findOwnedRunMeta.mockResolvedValue(loadedRun);
    runMaterializerMock.findRunForResponse.mockResolvedValue(refreshedRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(
      formattedResponse,
    );

    await expect(
      service.getRun('user-id', 'practice-run-id', { parts: '1' }),
    ).resolves.toBe(formattedResponse);

    expect(
      runMaterializerMock.ensurePracticeRunIncludesParts,
    ).not.toHaveBeenCalled();
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      refreshedRun,
      [1],
      { year: 2026 },
    );
  });

  it('expandRunParts persists additional parts on a practice session', async () => {
    const loadedRun = {
      id: 'practice-run-id',
      mode: ToeicRunMode.PRACTICE,
      toeicTestId: 1,
      selectedParts: [1],
    };
    const refreshedRun = buildToeicRunForResponse({
      id: 'practice-run-id',
      selectedParts: [1, 2],
    });
    const formattedResponse = {
      sessionId: 'practice-run-id',
      partNumbers: [1, 2],
      year: 2026,
    };

    runRepositoryMock.findOwnedRunMeta.mockResolvedValue(loadedRun);
    runMaterializerMock.findRunForResponse.mockResolvedValue(refreshedRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(
      formattedResponse,
    );

    await expect(
      service.expandRunParts('user-id', 'practice-run-id', {
        partNumbers: [1, 2],
      }),
    ).resolves.toBe(formattedResponse);

    expect(
      runMaterializerMock.ensurePracticeRunIncludesParts,
    ).toHaveBeenCalledWith('practice-run-id', 1, [1, 2]);
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      refreshedRun,
      [1, 2],
      { year: 2026 },
    );
  });

  it('expandRunParts rejects mock sessions', async () => {
    runRepositoryMock.findOwnedRunMeta.mockResolvedValue({
      id: 'mock-run-id',
      mode: ToeicRunMode.MOCK_TEST,
      toeicTestId: 1,
      selectedParts: [1],
    });

    await expect(
      service.expandRunParts('user-id', 'mock-run-id', { partNumbers: [1] }),
    ).rejects.toThrow(
      'Only practice runs can be expanded with additional parts.',
    );

    expect(
      runMaterializerMock.ensurePracticeRunIncludesParts,
    ).not.toHaveBeenCalled();
  });

  it('getRun returns review wrong view over the shared practice session', async () => {
    runRepositoryMock.getTestYear.mockResolvedValue(2025);
    const loadedRun = {
      id: 'practice-run-id',
      mode: ToeicRunMode.PRACTICE,
      toeicTestId: 1,
      selectedParts: [1],
    };
    const refreshedRun = buildToeicRunForResponse({
      id: 'practice-run-id',
      totalRight: 1,
      totalWrong: 1,
      groups: [
        buildPhotoRunGroup({
          answerStatus: ToeicRunQuestionStatus.WRONG,
          selectedKey: 'B',
          status: ToeicRunGroupStatus.WRONG,
        }),
      ],
    });
    const formattedResponse = {
      sessionId: 'practice-run-id',
      mode: 'review_wrong',
      year: 2025,
    };

    runRepositoryMock.findOwnedRunMeta.mockResolvedValue(loadedRun);
    runMaterializerMock.findRunForResponse.mockResolvedValue(refreshedRun);
    sessionMapperMock.formatSessionResponse.mockResolvedValue(
      formattedResponse,
    );

    await expect(
      service.getRun('user-id', 'practice-run-id', {
        parts: '1',
        mode: 'review_wrong',
      }),
    ).resolves.toBe(formattedResponse);

    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      refreshedRun,
      [1],
      {
        year: 2025,
        mode: 'review_wrong',
        groupFilter: expect.any(Function) as (group: unknown) => boolean,
      },
    );
    const reviewFormatOptions =
      getMockCallArg<FormatToeicSessionResponseOptions>(
        sessionMapperMock.formatSessionResponse,
        0,
        2,
      );
    expect(
      reviewFormatOptions.groupFilter?.(
        buildPhotoRunGroup({ status: ToeicRunGroupStatus.WRONG }),
      ),
    ).toBe(true);
  });

  it('getRun rejects review wrong mode for mock sessions', async () => {
    runRepositoryMock.findOwnedRunMeta.mockResolvedValue({
      id: 'mock-run-id',
      mode: ToeicRunMode.MOCK_TEST,
      toeicTestId: 1,
      selectedParts: [1],
    });

    await expect(
      service.getRun('user-id', 'mock-run-id', {
        parts: '1',
        mode: 'review_wrong',
      }),
    ).rejects.toThrow('Review wrong is not supported for mock test runs.');

    expect(runMaterializerMock.findRunForResponse).not.toHaveBeenCalled();
  });
});
