import { ExperienceSummaryRepository } from './experience-summary.repository';

describe('ExperienceSummaryRepository', () => {
  it('returns zero before a user has an Experience row', async () => {
    const prisma = {
      userExperience: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const repository = new ExperienceSummaryRepository(prisma as never);

    await expect(repository.getTotalXp('user-id')).resolves.toBe(0);
  });

  it('reads the authoritative accumulated total', async () => {
    const prisma = {
      userExperience: {
        findUnique: jest.fn().mockResolvedValue({ totalXp: 2916 }),
      },
    };
    const repository = new ExperienceSummaryRepository(prisma as never);

    await expect(repository.getTotalXp('user-id')).resolves.toBe(2916);
  });
});
