import { StudyTimeLeaderboardRepository } from './study-time-leaderboard.repository';

describe('StudyTimeLeaderboardRepository', () => {
  it('delegates global aggregation to Prisma for the requested inclusive range', async () => {
    const records = [
      {
        rank: 1,
        userId: 'user-id',
        name: 'Linh',
        avatarUrl: null,
        avatarStoragePath: null,
        studySeconds: 7200,
      },
    ];
    const prisma = { $queryRaw: jest.fn().mockResolvedValue(records) };
    const repository = new StudyTimeLeaderboardRepository(prisma as never);

    await expect(
      repository.getEntries({
        startsOn: new Date('2026-08-10T00:00:00.000Z'),
        endsOn: new Date('2026-08-16T00:00:00.000Z'),
      }),
    ).resolves.toEqual(records);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('queries all confirmed activity without a date range for all time', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([]) };
    const repository = new StudyTimeLeaderboardRepository(prisma as never);

    await expect(repository.getEntries(null)).resolves.toEqual([]);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
