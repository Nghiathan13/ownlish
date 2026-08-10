import { LearningActivityType } from '@prisma/client';
import { LearningActivityController } from './learning-activity.controller';

describe('LearningActivityController', () => {
  const request = { user: { id: 'user-id' } } as never;

  function createController() {
    const service = {
      getCalendar: jest.fn(),
      submitCheckpoint: jest.fn(),
    };

    return {
      controller: new LearningActivityController(service as never),
      service,
    };
  }

  it('gets the authenticated user calendar', () => {
    const { controller, service } = createController();
    service.getCalendar.mockReturnValue({ days: [] });

    expect(controller.getCalendar(request)).toEqual({ days: [] });
    expect(service.getCalendar).toHaveBeenCalledWith('user-id');
  });

  it('submits a checkpoint for the authenticated user', () => {
    const { controller, service } = createController();
    const dto = {
      activityType: LearningActivityType.DICTATION,
      kind: 'flush' as const,
      elapsedSeconds: 15,
    };
    service.submitCheckpoint.mockReturnValue({ acceptedSeconds: 15 });

    expect(controller.submitCheckpoint(request, dto)).toEqual({
      acceptedSeconds: 15,
    });
    expect(service.submitCheckpoint).toHaveBeenCalledWith('user-id', dto);
  });
});
