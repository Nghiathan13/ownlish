import { BadRequestException } from '@nestjs/common';
import { getVietnamLearningDay } from '../../../common/lib/vietnam-learning-day';
import type {
  StudyTimeLeaderboardPeriod,
  StudyTimeLeaderboardQuery,
  StudyTimeLeaderboardRange,
} from './study-time-leaderboard.types';

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateKey(value: string) {
  if (!DATE_KEY_PATTERN.test(value)) {
    throw new BadRequestException('anchor must use the YYYY-MM-DD format');
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || toDateKey(date) !== value) {
    throw new BadRequestException('anchor must be a valid calendar date');
  }

  return date;
}

function getIsoWeekStart(date: Date) {
  const day = date.getUTCDay() || 7;

  return new Date(date.getTime() - (day - 1) * DAY_MS);
}

function getMonthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function getMonthEnd(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function getPeriodRange(
  period: Exclude<StudyTimeLeaderboardPeriod, 'all'>,
  anchor: Date,
): StudyTimeLeaderboardRange {
  if (period === 'week') {
    const startsOn = getIsoWeekStart(anchor);

    return { startsOn, endsOn: addDays(startsOn, 6) };
  }

  return { startsOn: getMonthStart(anchor), endsOn: getMonthEnd(anchor) };
}

export function getStudyTimeLeaderboardRange(
  query: StudyTimeLeaderboardQuery,
  now = new Date(),
): StudyTimeLeaderboardRange | null {
  if (query.period === 'all') {
    if (query.anchor !== undefined) {
      throw new BadRequestException(
        'anchor is not supported for the all-time leaderboard',
      );
    }

    return null;
  }

  if (!query.anchor) {
    throw new BadRequestException(
      'anchor is required for week and month leaderboards',
    );
  }

  const range = getPeriodRange(query.period, parseDateKey(query.anchor));

  if (toDateKey(range.startsOn) !== query.anchor) {
    throw new BadRequestException(
      query.period === 'week'
        ? 'week anchor must be an ISO Monday'
        : 'month anchor must be the first day of the month',
    );
  }

  const currentRange = getPeriodRange(query.period, getVietnamLearningDay(now));

  if (range.startsOn > currentRange.startsOn) {
    throw new BadRequestException(
      'future leaderboard periods are not supported',
    );
  }

  return range;
}

export function formatLeaderboardDateKey(date: Date) {
  return toDateKey(date);
}
