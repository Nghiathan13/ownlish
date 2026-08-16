import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StudyTimeLeaderboardQueryDto } from './study-time-leaderboard-query.dto';

describe('StudyTimeLeaderboardQueryDto', () => {
  it('can be constructed as the request DTO', () => {
    expect(new StudyTimeLeaderboardQueryDto()).toBeInstanceOf(
      StudyTimeLeaderboardQueryDto,
    );
  });

  it('accepts supported periods and an optional date-shaped anchor', async () => {
    await expect(
      validate(
        plainToInstance(StudyTimeLeaderboardQueryDto, {
          period: 'week',
          anchor: '2026-08-10',
        }),
      ),
    ).resolves.toHaveLength(0);
  });

  it('rejects unsupported periods and malformed anchors', async () => {
    await expect(
      validate(
        plainToInstance(StudyTimeLeaderboardQueryDto, {
          period: 'year',
          anchor: '10-08-2026',
        }),
      ),
    ).resolves.not.toHaveLength(0);
  });
});
