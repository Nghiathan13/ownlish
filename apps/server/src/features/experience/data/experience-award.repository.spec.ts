import { ExperienceEventKind } from '@prisma/client';
import { ExperienceAwardRepository } from './experience-award.repository';

describe('ExperienceAwardRepository', () => {
  it('uses the caller transaction to check and record a positive ledger event', async () => {
    const transaction = {
      $executeRaw: jest.fn(),
      experienceEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(3),
        create: jest.fn(),
      },
      userExperience: { upsert: jest.fn() },
    };
    const repository = new ExperienceAwardRepository();
    const learnedOn = new Date('2026-08-16T00:00:00.000Z');
    const event = {
      kind: ExperienceEventKind.TEST_CORRECT,
      subjectKey: 'question-1',
      xp: 2,
    };

    await repository.lockUserDay(transaction as never, 'user-id', learnedOn);
    await expect(
      repository.hasEvent(transaction as never, {
        userId: 'user-id',
        learnedOn,
        kind: event.kind,
        subjectKey: event.subjectKey,
      }),
    ).resolves.toBe(false);
    await expect(
      repository.countEvents(transaction as never, {
        userId: 'user-id',
        learnedOn,
        kind: event.kind,
      }),
    ).resolves.toBe(3);
    await repository.recordEvent(transaction as never, {
      userId: 'user-id',
      learnedOn,
      event,
    });

    expect(transaction.$executeRaw).toHaveBeenCalledTimes(1);
    expect(transaction.experienceEvent.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        learnedOn,
        kind: ExperienceEventKind.TEST_CORRECT,
        subjectKey: 'question-1',
        xp: 2,
      },
    });
    expect(transaction.userExperience.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      create: { userId: 'user-id', totalXp: 2 },
      update: { totalXp: { increment: 2 } },
    });
  });
});
