import { BadRequestException } from '@nestjs/common';
import { getStudyTimeLeaderboardRange } from './study-time-leaderboard-range';

describe('getStudyTimeLeaderboardRange', () => {
  const now = new Date('2026-08-16T10:00:00.000Z');

  it('does not create a date range for all time', () => {
    expect(getStudyTimeLeaderboardRange({ period: 'all' }, now)).toBeNull();
  });

  it('rejects an all-time anchor because it would make the URL non-canonical', () => {
    expect(() =>
      getStudyTimeLeaderboardRange(
        { period: 'all', anchor: '2026-08-10' },
        now,
      ),
    ).toThrow(BadRequestException);
  });

  it('uses an inclusive ISO week range', () => {
    expect(
      getStudyTimeLeaderboardRange(
        { period: 'week', anchor: '2026-08-10' },
        now,
      ),
    ).toEqual({
      startsOn: new Date('2026-08-10T00:00:00.000Z'),
      endsOn: new Date('2026-08-16T00:00:00.000Z'),
    });
  });

  it('uses the full anchored month range', () => {
    expect(
      getStudyTimeLeaderboardRange(
        { period: 'month', anchor: '2026-02-01' },
        now,
      ),
    ).toEqual({
      startsOn: new Date('2026-02-01T00:00:00.000Z'),
      endsOn: new Date('2026-02-28T00:00:00.000Z'),
    });
  });

  it('rejects non-canonical, missing, malformed, and future anchors', () => {
    expect(() =>
      getStudyTimeLeaderboardRange(
        { period: 'week', anchor: '2026-08-11' },
        now,
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      getStudyTimeLeaderboardRange({ period: 'month' }, now),
    ).toThrow(BadRequestException);
    expect(() =>
      getStudyTimeLeaderboardRange(
        { period: 'month', anchor: '2026-02-30' },
        now,
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      getStudyTimeLeaderboardRange(
        { period: 'week', anchor: 'Aug-10-2026' },
        now,
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      getStudyTimeLeaderboardRange(
        { period: 'month', anchor: '2026-09-01' },
        now,
      ),
    ).toThrow(BadRequestException);
  });
});
