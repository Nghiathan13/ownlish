import { ExperienceLeaderboardRepository } from './experience-leaderboard.repository';

describe('ExperienceLeaderboardRepository', () => {
  it('delegates the all-time top-100 ranked public projection to Prisma', async () => {
    const records = [
      {
        rank: 1,
        name: 'Linh',
        avatarUrl: null,
        avatarStoragePath: null,
        experience: 880,
      },
    ];
    const prisma = { $queryRaw: jest.fn().mockResolvedValue(records) };
    const repository = new ExperienceLeaderboardRepository(prisma as never);

    await expect(repository.getEntries()).resolves.toEqual(records);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
