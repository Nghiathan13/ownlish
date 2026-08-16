import { ExperienceController } from './experience.controller';

describe('ExperienceController', () => {
  it('uses the authenticated user and returns only the summary', async () => {
    const experienceSummaryService = {
      getSummary: jest.fn().mockResolvedValue({ totalXp: 120 }),
    };
    const controller = new ExperienceController(
      experienceSummaryService as never,
    );

    await expect(
      controller.getSummary({ user: { id: 'user-id' } } as never),
    ).resolves.toEqual({ totalXp: 120 });
    expect(experienceSummaryService.getSummary).toHaveBeenCalledWith('user-id');
  });
});
