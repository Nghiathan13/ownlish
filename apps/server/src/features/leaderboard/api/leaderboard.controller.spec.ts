import { LeaderboardController } from './leaderboard.controller';

describe('LeaderboardController', () => {
  it('gets the requested study-time leaderboard', () => {
    const studyTimeLeaderboardService = {
      getLeaderboard: jest.fn().mockReturnValue({ entries: [] }),
    };
    const experienceLeaderboardService = { getLeaderboard: jest.fn() };
    const controller = new LeaderboardController(
      studyTimeLeaderboardService as never,
      experienceLeaderboardService as never,
    );
    const query = { period: 'week' as const, anchor: '2026-08-10' };

    expect(controller.getStudyTimeLeaderboard(query)).toEqual({ entries: [] });
    expect(studyTimeLeaderboardService.getLeaderboard).toHaveBeenCalledWith(
      query,
    );
  });

  it('gets the all-time Experience leaderboard without range input', () => {
    const studyTimeLeaderboardService = { getLeaderboard: jest.fn() };
    const experienceLeaderboardService = {
      getLeaderboard: jest.fn().mockReturnValue({ entries: [] }),
    };
    const controller = new LeaderboardController(
      studyTimeLeaderboardService as never,
      experienceLeaderboardService as never,
    );

    expect(controller.getExperienceLeaderboard()).toEqual({ entries: [] });
    expect(experienceLeaderboardService.getLeaderboard).toHaveBeenCalledWith();
  });
});
