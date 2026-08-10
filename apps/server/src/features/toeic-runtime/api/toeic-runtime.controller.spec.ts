import { HttpStatus } from '@nestjs/common';
import { ToeicRuntimeController } from './toeic-runtime.controller';

describe('ToeicRuntimeController', () => {
  const request = { user: { id: 'user-id' } } as never;
  const sessionId = '11111111-1111-4111-8111-111111111111';

  function createController() {
    const service = {
      createTestRun: jest.fn(),
      createPartPracticeRun: jest.fn(),
      prepareMockRun: jest.fn(),
      restartMockRun: jest.fn(),
      listTestPracticeRuns: jest.fn(),
      listMockRuns: jest.fn(),
      clearTestPracticeRun: jest.fn(),
      listPartPracticeRuns: jest.fn(),
      clearPartPracticeRun: jest.fn(),
      getRun: jest.fn(),
      submitAnswer: jest.fn(),
      finishMockRun: jest.fn(),
      updateMockTimer: jest.fn(),
    };

    return {
      controller: new ToeicRuntimeController(service as never),
      service,
    };
  }

  it('delegates run creation and mock selection to the authenticated user', async () => {
    const { controller, service } = createController();
    const testDto = {
      testKey: 'ets26-t01',
      partNumbers: [1],
      mode: 'practice',
    };
    const partDto = { partNumber: 2 };
    const mockDto = { testKey: 'ets26-t01', partNumbers: [1] };

    await Promise.all([
      controller.createTestRun(request, testDto),
      controller.createPartPracticeRun(request, partDto),
      controller.prepareMockRun(request, mockDto),
      controller.restartMockRun(request, mockDto),
    ]);

    expect(service.createTestRun).toHaveBeenCalledWith('user-id', testDto);
    expect(service.createPartPracticeRun).toHaveBeenCalledWith(
      'user-id',
      partDto,
    );
    expect(service.prepareMockRun).toHaveBeenCalledWith('user-id', mockDto);
    expect(service.restartMockRun).toHaveBeenCalledWith('user-id', mockDto);
  });

  it('delegates test and part-practice listings and resets', async () => {
    const { controller, service } = createController();

    await Promise.all([
      controller.listTestPracticeRuns(request),
      controller.listMockRuns(request, 'ets26-t01'),
      controller.clearTestPracticeRun(request, 'ets26-t01'),
      controller.listPartPracticeRuns(request),
      controller.clearPartPracticeRun(request, 3),
    ]);

    expect(service.listTestPracticeRuns).toHaveBeenCalledWith('user-id');
    expect(service.listMockRuns).toHaveBeenCalledWith('user-id', 'ets26-t01');
    expect(service.clearTestPracticeRun).toHaveBeenCalledWith(
      'user-id',
      'ets26-t01',
    );
    expect(service.listPartPracticeRuns).toHaveBeenCalledWith('user-id');
    expect(service.clearPartPracticeRun).toHaveBeenCalledWith('user-id', 3);
  });

  it('delegates run lookup, answer submission, and timer updates', async () => {
    const { controller, service } = createController();
    const answerDto = { questionKey: 'ets26-t01-p1-q001', selectedKey: 'A' };
    const timerDto = { remainingSeconds: 120 };

    await Promise.all([
      controller.getRun(request, sessionId),
      controller.submitAnswer(request, sessionId, answerDto),
      controller.updateMockTimer(request, sessionId, timerDto),
    ]);

    expect(service.getRun).toHaveBeenCalledWith('user-id', sessionId);
    expect(service.submitAnswer).toHaveBeenCalledWith(
      'user-id',
      sessionId,
      answerDto,
    );
    expect(service.updateMockTimer).toHaveBeenCalledWith(
      'user-id',
      sessionId,
      timerDto,
    );
  });

  it.each([
    ['accepted', HttpStatus.ACCEPTED],
    ['completed', HttpStatus.OK],
  ])('sets the matching finish status for %s results', async (status, code) => {
    const { controller, service } = createController();
    const response = { status: jest.fn() } as never;
    const result = { status };
    service.finishMockRun.mockResolvedValue(result);

    await expect(
      controller.finishMockRun(request, sessionId, response),
    ).resolves.toBe(result);
    expect(response.status).toHaveBeenCalledWith(code);
    expect(service.finishMockRun).toHaveBeenCalledWith('user-id', sessionId);
  });
});
