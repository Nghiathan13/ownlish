import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ToeicRunMode } from '@prisma/client';
import { ToeicRunService } from './toeic-run.service';
import { ToeicRunGrader } from './lib/toeic-run/grader';
import { ToeicRunMaterializer } from './lib/toeic-run/materializer';
import { ToeicRunRepository } from './lib/toeic-run/repository';
import { ToeicRunSessionMapper } from './lib/toeic-run/session.mapper';
import { buildToeicRunForResponse } from './testing/toeic-run.fixtures';

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
    findOrCreatePracticeRun: jest.fn(),
    createRun: jest.fn(),
  };
  const sessionMapperMock = { formatSessionResponse: jest.fn() };
  const runGraderMock = { submitAnswer: jest.fn(), completeMockRun: jest.fn() };

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

  it('reuses a practice run and unions requested parts', async () => {
    const run = buildToeicRunForResponse({
      id: 'run-id',
      selectedParts: [1, 2],
    });
    runMaterializerMock.findOrCreatePracticeRun.mockResolvedValue(run);
    sessionMapperMock.formatSessionResponse.mockResolvedValue({
      sessionId: 'run-id',
    });

    await service.createRun('user-id', { testId: 1, partNumbers: [1, 2] });

    expect(runMaterializerMock.findOrCreatePracticeRun).toHaveBeenCalledWith({
      userId: 'user-id',
      testId: 1,
      selectedParts: [1, 2],
    });
    expect(runMaterializerMock.createRun).not.toHaveBeenCalled();
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      run,
      [1, 2],
      { year: 2026 },
    );
  });

  it('creates a new practice run only when none exists', async () => {
    const run = buildToeicRunForResponse({ id: 'new-run-id' });
    runMaterializerMock.findOrCreatePracticeRun.mockResolvedValue(run);
    sessionMapperMock.formatSessionResponse.mockResolvedValue({
      sessionId: 'new-run-id',
    });

    await service.createRun('user-id', { testId: 1, partNumbers: [1] });

    expect(runMaterializerMock.findOrCreatePracticeRun).toHaveBeenCalledWith({
      userId: 'user-id',
      testId: 1,
      selectedParts: [1],
    });
  });

  it('always creates a new mock run', async () => {
    const run = buildToeicRunForResponse({
      id: 'mock-run-id',
      mode: ToeicRunMode.MOCK_TEST,
    });
    runMaterializerMock.createRun.mockResolvedValue(run);
    sessionMapperMock.formatSessionResponse.mockResolvedValue({
      sessionId: 'mock-run-id',
    });

    await service.createRun('user-id', {
      testId: 1,
      partNumbers: [1],
      mode: 'mock_test',
    });

    expect(runMaterializerMock.findOrCreatePracticeRun).not.toHaveBeenCalled();
    expect(runMaterializerMock.createRun).toHaveBeenCalledWith({
      userId: 'user-id',
      testId: 1,
      mode: ToeicRunMode.MOCK_TEST,
      selectedParts: [1],
    });
  });

  it('uses the shared practice run for review wrong', async () => {
    const run = buildToeicRunForResponse({ id: 'practice-run-id' });
    runMaterializerMock.findOrCreatePracticeRun.mockResolvedValue(run);
    sessionMapperMock.formatSessionResponse.mockResolvedValue({
      mode: 'review_wrong',
    });

    await service.createRun('user-id', {
      testId: 1,
      partNumbers: [1],
      mode: 'review_wrong',
    });

    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      run,
      [1],
      {
        year: 2026,
        mode: 'review_wrong',
      },
    );
  });

  it('formats an existing practice run without changing stored parts', async () => {
    const run = buildToeicRunForResponse({
      id: 'practice-run-id',
      selectedParts: [1, 2],
    });
    runRepositoryMock.findOwnedRunMeta.mockResolvedValue(run);
    sessionMapperMock.formatSessionResponse.mockResolvedValue({
      sessionId: run.id,
    });

    await service.getRun('user-id', run.id, { parts: '1' });

    expect(runMaterializerMock.findOrCreatePracticeRun).not.toHaveBeenCalled();
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      run,
      [1],
      { year: 2026 },
    );
  });

  it('expands a practice run by unioning parts', async () => {
    const loaded = buildToeicRunForResponse({
      id: 'practice-run-id',
      selectedParts: [1],
    });
    const refreshed = buildToeicRunForResponse({
      id: loaded.id,
      selectedParts: [1, 2],
    });
    runRepositoryMock.findOwnedRunMeta.mockResolvedValue(loaded);
    runMaterializerMock.findOrCreatePracticeRun.mockResolvedValue(refreshed);
    sessionMapperMock.formatSessionResponse.mockResolvedValue({
      sessionId: loaded.id,
    });

    await service.expandRunParts('user-id', loaded.id, { partNumbers: [2] });

    expect(runMaterializerMock.findOrCreatePracticeRun).toHaveBeenCalledWith({
      userId: 'user-id',
      testId: 1,
      selectedParts: [2],
    });
    expect(sessionMapperMock.formatSessionResponse).toHaveBeenCalledWith(
      refreshed,
      [2],
      { year: 2026 },
    );
  });

  it('rejects expanding a mock run', async () => {
    runRepositoryMock.findOwnedRunMeta.mockResolvedValue(
      buildToeicRunForResponse({ mode: ToeicRunMode.MOCK_TEST }),
    );
    await expect(
      service.expandRunParts('user-id', 'mock-id', { partNumbers: [1] }),
    ).rejects.toThrow(
      'Only practice runs can be expanded with additional parts.',
    );
  });

  it('rejects a get request for a part outside the session', async () => {
    const run = buildToeicRunForResponse({ selectedParts: [1] });
    runRepositoryMock.findOwnedRunMeta.mockResolvedValue(run);

    await expect(
      service.getRun('user-id', run.id, { parts: '2' }),
    ).rejects.toThrow('Requested part is not in this session.');
  });

  it('delegates answer selection to the grader', async () => {
    runGraderMock.submitAnswer.mockResolvedValue({ graded: false });
    const dto = { toeicQuestionId: 1001, selectedKey: 'B' as const };
    await expect(
      service.submitAnswer('user-id', 'run-id', dto),
    ).resolves.toEqual({ graded: false });
    expect(runGraderMock.submitAnswer).toHaveBeenCalledWith(
      'user-id',
      'run-id',
      dto,
    );
  });

  it('accepts mock finish before running the background grade', async () => {
    runRepositoryMock.findOwnedRun.mockResolvedValue({
      id: 'mock-id',
      mode: ToeicRunMode.MOCK_TEST,
      completedAt: null,
    });
    runGraderMock.completeMockRun.mockResolvedValue(undefined);

    await expect(service.finishRun('user-id', 'mock-id')).resolves.toEqual({
      status: 'accepted',
    });
    expect(runGraderMock.completeMockRun).not.toHaveBeenCalled();
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(runGraderMock.completeMockRun).toHaveBeenCalledWith('mock-id');
  });

  it('permits a later finish retry after a background failure', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    runRepositoryMock.findOwnedRun.mockResolvedValue({
      id: 'mock-id',
      mode: ToeicRunMode.MOCK_TEST,
      completedAt: null,
    });
    runGraderMock.completeMockRun
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce(undefined);

    await service.finishRun('user-id', 'mock-id');
    await new Promise<void>((resolve) => setImmediate(resolve));
    await Promise.resolve();
    await service.finishRun('user-id', 'mock-id');
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(runGraderMock.completeMockRun).toHaveBeenCalledTimes(2);
    errorSpy.mockRestore();
  });

  it('clears only practice answer history', async () => {
    runRepositoryMock.findTestById.mockResolvedValue({ id: 1, year: 2026 });
    runRepositoryMock.resetPracticeRunAnswers.mockResolvedValue(1);
    await expect(service.clearTestHistory('user-id', 1)).resolves.toEqual({
      deletedSessionCount: 1,
    });
  });
});
