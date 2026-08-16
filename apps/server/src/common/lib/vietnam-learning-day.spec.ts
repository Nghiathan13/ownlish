import {
  getVietnamLearningDay,
  getVietnamLearningDateKey,
  getVietnamLearningDayStart,
} from './vietnam-learning-day';

describe('Vietnam learning day', () => {
  it('returns the UTC date value used to store a Vietnam learning day', () => {
    const instant = new Date('2026-07-30T17:00:30.000Z');

    expect(getVietnamLearningDay(instant)).toEqual(
      new Date('2026-07-31T00:00:00.000Z'),
    );
    expect(getVietnamLearningDateKey(instant)).toBe('2026-07-31');
  });

  it('returns the actual instant at the start of a Vietnam learning day', () => {
    expect(
      getVietnamLearningDayStart(new Date('2026-07-30T17:00:30.000Z')),
    ).toEqual(new Date('2026-07-30T17:00:00.000Z'));
  });
});
