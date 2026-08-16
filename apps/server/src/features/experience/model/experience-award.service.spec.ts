/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { ExperienceEventKind } from '@prisma/client';
import { ExperienceAwardService } from './experience-award.service';

type EventRecord = {
  userId: string;
  learnedOn: Date;
  kind: ExperienceEventKind;
  subjectKey: string;
  xp: number;
};

function createService() {
  const events: EventRecord[] = [];
  let totalXp = 0;
  const repository = {
    lockUserDay: jest.fn(),
    hasEvent: jest.fn(async (_tx, input) =>
      events.some(
        (event) =>
          event.userId === input.userId &&
          event.learnedOn.getTime() === input.learnedOn.getTime() &&
          event.kind === input.kind &&
          event.subjectKey === input.subjectKey,
      ),
    ),
    countEvents: jest.fn(
      async (_tx, input) =>
        events.filter(
          (event) =>
            event.userId === input.userId &&
            event.learnedOn.getTime() === input.learnedOn.getTime() &&
            event.kind === input.kind,
        ).length,
    ),
    recordEvent: jest.fn(async (_tx, input) => {
      events.push({
        userId: input.userId,
        learnedOn: input.learnedOn,
        kind: input.event.kind,
        subjectKey: input.event.subjectKey,
        xp: input.event.xp,
      });
      totalXp += input.event.xp;
    }),
  };

  return {
    events,
    getTotalXp: () => totalXp,
    repository,
    service: new ExperienceAwardService(repository as never),
    transaction: {},
  };
}

describe('ExperienceAwardService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-16T10:00:00.000Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('awards a 10-answer milestone and keeps Test and Mock duplicate spaces separate', async () => {
    const { events, getTotalXp, service, transaction } = createService();

    for (let index = 1; index <= 10; index += 1) {
      await service.award(transaction as never, {
        type: 'correct-answer',
        userId: 'user-id',
        questionKey: `question-${index}`,
        bucket: 'test',
      });
    }
    await service.award(transaction as never, {
      type: 'correct-answer',
      userId: 'user-id',
      questionKey: 'question-1',
      bucket: 'mock',
    });

    expect(getTotalXp()).toBe(24);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: ExperienceEventKind.TEST_MILESTONE,
          subjectKey: 'milestone:10',
          xp: 2,
        }),
        expect.objectContaining({
          kind: ExperienceEventKind.MOCK_CORRECT,
          subjectKey: 'question-1',
          xp: 2,
        }),
      ]),
    );
  });

  it('suppresses a same-day duplicate but awards the same content on the next Vietnam day', async () => {
    const { getTotalXp, service, transaction } = createService();
    const correctAnswer = {
      type: 'correct-answer' as const,
      userId: 'user-id',
      questionKey: 'question-1',
      bucket: 'test' as const,
    };

    await expect(
      service.award(transaction as never, correctAnswer),
    ).resolves.toBe(2);
    await expect(
      service.award(transaction as never, correctAnswer),
    ).resolves.toBe(0);

    jest.setSystemTime(new Date('2026-08-17T10:00:00.000Z'));
    await expect(
      service.award(transaction as never, correctAnswer),
    ).resolves.toBe(2);
    expect(getTotalXp()).toBe(4);
  });

  it('awards a verified Dictation segment once per Vietnam day', async () => {
    const { getTotalXp, service, transaction } = createService();
    const segment = {
      type: 'dictation-segment' as const,
      userId: 'user-id',
      videoId: 'video-1',
      segmentId: 's001',
    };

    await expect(service.award(transaction as never, segment)).resolves.toBe(4);
    await expect(service.award(transaction as never, segment)).resolves.toBe(0);
    expect(getTotalXp()).toBe(4);
  });

  it('enforces the review, Dictation video, and Mock part daily caps independently', async () => {
    const { events, service, transaction } = createService();
    const day = new Date('2026-08-16T00:00:00.000Z');
    events.push(
      ...Array.from({ length: 100 }, (_, index) => ({
        userId: 'user-id',
        learnedOn: day,
        kind: ExperienceEventKind.REVIEW_EASY,
        subjectKey: `user-vocab:${index}`,
        xp: 2,
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        userId: 'user-id',
        learnedOn: day,
        kind: ExperienceEventKind.DICTATION_VIDEO,
        subjectKey: `video-${index}`,
        xp: 20,
      })),
      ...Array.from({ length: 14 }, (_, index) => ({
        userId: 'user-id',
        learnedOn: day,
        kind: ExperienceEventKind.MOCK_PART,
        subjectKey: `test:part:${index}`,
        xp: 4,
      })),
    );

    await expect(
      service.award(transaction as never, {
        type: 'review-easy',
        userId: 'user-id',
        source: 'oxford',
        subjectId: 'definition-id',
      }),
    ).resolves.toBe(0);
    await expect(
      service.award(transaction as never, {
        type: 'dictation-video',
        userId: 'user-id',
        videoId: 'video-6',
      }),
    ).resolves.toBe(0);
    await expect(
      service.award(transaction as never, {
        type: 'mock-part',
        userId: 'user-id',
        testKey: 'test',
        partNumber: 7,
      }),
    ).resolves.toBe(0);
  });

  it('waits for the per-user Vietnam-day lock before checking duplicate events', async () => {
    const { events, repository, service, transaction } = createService();
    let releaseSecondLock: (() => void) | null = null;
    let recordFirstEvent: (() => void) | null = null;
    const firstEventRecorded = new Promise<void>((resolve) => {
      recordFirstEvent = resolve;
    });
    repository.lockUserDay.mockImplementation(() => {
      if (repository.lockUserDay.mock.calls.length === 1) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        releaseSecondLock = resolve;
      });
    });
    repository.recordEvent.mockImplementation(async (_tx, input) => {
      events.push({
        userId: input.userId,
        learnedOn: input.learnedOn,
        kind: input.event.kind,
        subjectKey: input.event.subjectKey,
        xp: input.event.xp,
      });
      recordFirstEvent?.();
    });
    const correctAnswer = {
      type: 'correct-answer' as const,
      userId: 'user-id',
      questionKey: 'question-1',
      bucket: 'test' as const,
    };

    const first = service.award(transaction as never, correctAnswer);
    const second = service.award(transaction as never, correctAnswer);
    await firstEventRecorded;
    releaseSecondLock?.();

    await expect(Promise.all([first, second])).resolves.toEqual([2, 0]);
    expect(repository.recordEvent).toHaveBeenCalledTimes(1);
  });
});
