import { ExperienceLeaderboardService } from './experience-leaderboard.service';

describe('ExperienceLeaderboardService', () => {
  it('returns public ranked experience data without internal identifiers', async () => {
    const experienceLeaderboardRepository = { getEntries: jest.fn() };
    const profileAvatarStorageService = { getPublicUrl: jest.fn() };
    const service = new ExperienceLeaderboardService(
      experienceLeaderboardRepository as never,
      profileAvatarStorageService as never,
    );
    experienceLeaderboardRepository.getEntries.mockResolvedValue([
      {
        rank: 1,
        name: ' Linh ',
        avatarUrl: null,
        avatarStoragePath: 'users/linh/avatar.png',
        experience: 880,
      },
      {
        rank: 2,
        name: null,
        avatarUrl: 'https://google.example/learner',
        avatarStoragePath: null,
        experience: 820,
      },
    ]);
    profileAvatarStorageService.getPublicUrl.mockReturnValue(
      'https://assets.example/users/linh/avatar.png',
    );

    await expect(service.getLeaderboard()).resolves.toEqual({
      entries: [
        {
          rank: 1,
          displayName: 'Linh',
          avatarUrl: 'https://assets.example/users/linh/avatar.png',
          experience: 880,
        },
        {
          rank: 2,
          displayName: 'Learner',
          avatarUrl: 'https://google.example/learner',
          experience: 820,
        },
      ],
    });
  });
});
