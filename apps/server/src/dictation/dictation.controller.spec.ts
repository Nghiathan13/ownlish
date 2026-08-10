import { DictationController } from './dictation.controller';

describe('DictationController', () => {
  const request = { user: { id: 'user-id' } } as never;
  const dto = { segmentId: 's12', isCompleted: false };

  function createController() {
    const service = {
      getProgress: jest.fn(),
      submitAnswer: jest.fn(),
      resetProgress: jest.fn(),
    };

    return { controller: new DictationController(service as never), service };
  }

  it('delegates progress lookup for the authenticated user', () => {
    const { controller, service } = createController();
    service.getProgress.mockReturnValue({ videoId: 'video-id' });

    expect(controller.getProgress(request, 'video-id')).toEqual({
      videoId: 'video-id',
    });
    expect(service.getProgress).toHaveBeenCalledWith('user-id', 'video-id');
  });

  it('delegates answer submission for the authenticated user', () => {
    const { controller, service } = createController();
    service.submitAnswer.mockReturnValue({ correctCount: 1 });

    expect(controller.submitAnswer(request, 'video-id', dto)).toEqual({
      correctCount: 1,
    });
    expect(service.submitAnswer).toHaveBeenCalledWith(
      'user-id',
      'video-id',
      dto,
    );
  });

  it('delegates progress reset for the authenticated user', () => {
    const { controller, service } = createController();
    service.resetProgress.mockReturnValue(undefined);

    expect(controller.resetProgress(request, 'video-id')).toBeUndefined();
    expect(service.resetProgress).toHaveBeenCalledWith('user-id', 'video-id');
  });
});
