import { StudyTimeLeaderboardService } from './study-time-leaderboard.service';

function createService() {
  const studyTimeLeaderboardRepository = { getEntries: jest.fn() };
  const profileAvatarStorageService = { getPublicUrl: jest.fn() };

  return {
    studyTimeLeaderboardRepository,
    profileAvatarStorageService,
    service: new StudyTimeLeaderboardService(
      studyTimeLeaderboardRepository as never,
      profileAvatarStorageService as never,
    ),
  };
}

describe('StudyTimeLeaderboardService', () => {
  it('returns only public ranked learner data', async () => {
    const {
      studyTimeLeaderboardRepository,
      profileAvatarStorageService,
      service,
    } = createService();
    studyTimeLeaderboardRepository.getEntries.mockResolvedValue([
      {
        rank: 1,
        userId: 'internal-user-id',
        name: ' Linh ',
        avatarUrl: 'https://google.example/linh',
        avatarStoragePath: 'users/linh/avatar.png',
        studySeconds: 7200,
      },
      {
        rank: 2,
        userId: 'another-internal-user-id',
        name: null,
        avatarUrl: null,
        avatarStoragePath: null,
        studySeconds: 3600,
      },
      {
        rank: 3,
        userId: 'external-avatar-user-id',
        name: 'Mai',
        avatarUrl: 'https://google.example/mai',
        avatarStoragePath: null,
        studySeconds: 1800,
      },
    ]);
    profileAvatarStorageService.getPublicUrl.mockReturnValue(
      'https://assets.example/users/linh/avatar.png',
    );

    await expect(service.getLeaderboard({ period: 'all' })).resolves.toEqual({
      period: 'all',
      startsOn: null,
      endsOn: null,
      entries: [
        {
          rank: 1,
          displayName: 'Linh',
          avatarUrl: 'https://assets.example/users/linh/avatar.png',
          studySeconds: 7200,
        },
        {
          rank: 2,
          displayName: 'Learner',
          avatarUrl: null,
          studySeconds: 3600,
        },
        {
          rank: 3,
          displayName: 'Mai',
          avatarUrl: 'https://google.example/mai',
          studySeconds: 1800,
        },
      ],
    });

    expect(profileAvatarStorageService.getPublicUrl).toHaveBeenCalledWith(
      'users/linh/avatar.png',
    );
    expect(studyTimeLeaderboardRepository.getEntries).toHaveBeenCalledWith(
      null,
    );
  });

  it('formats a finite period and falls back to the external avatar URL', async () => {
    const {
      studyTimeLeaderboardRepository,
      profileAvatarStorageService,
      service,
    } = createService();
    studyTimeLeaderboardRepository.getEntries.mockResolvedValue([
      {
        rank: 1,
        userId: 'internal-user-id',
        name: 'Linh',
        avatarUrl: 'https://google.example/linh',
        avatarStoragePath: 'users/linh/avatar.png',
        studySeconds: 7200,
      },
    ]);
    profileAvatarStorageService.getPublicUrl.mockReturnValue(null);

    await expect(
      service.getLeaderboard({ period: 'week', anchor: '2026-08-10' }),
    ).resolves.toEqual({
      period: 'week',
      startsOn: '2026-08-10',
      endsOn: '2026-08-16',
      entries: [
        {
          rank: 1,
          displayName: 'Linh',
          avatarUrl: 'https://google.example/linh',
          studySeconds: 7200,
        },
      ],
    });
  });
});
