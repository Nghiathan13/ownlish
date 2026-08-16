import { ExperienceSummaryService } from './experience-summary.service';

describe('ExperienceSummaryService', () => {
  it('returns the public summary contract only', async () => {
    const repository = { getTotalXp: jest.fn().mockResolvedValue(880) };
    const service = new ExperienceSummaryService(repository as never);

    await expect(service.getSummary('user-id')).resolves.toEqual({
      totalXp: 880,
    });
    expect(repository.getTotalXp).toHaveBeenCalledWith('user-id');
  });
});
