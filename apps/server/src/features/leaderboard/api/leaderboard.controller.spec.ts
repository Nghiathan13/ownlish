import { LeaderboardController } from './leaderboard.controller';

describe('LeaderboardController', () => {
  it('gets the requested study-time leaderboard', () => {
    const service = {
      getStudyTimeLeaderboard: jest.fn().mockReturnValue({ entries: [] }),
    };
    const controller = new LeaderboardController(service as never);
    const query = { period: 'week' as const, anchor: '2026-08-10' };

    expect(controller.getStudyTimeLeaderboard(query)).toEqual({ entries: [] });
    expect(service.getStudyTimeLeaderboard).toHaveBeenCalledWith(query);
  });
});
