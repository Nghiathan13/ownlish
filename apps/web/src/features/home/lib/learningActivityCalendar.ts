import {
  LEARNING_ACTIVITY_CALENDAR_MODES,
  LEARNING_ACTIVITY_TYPES,
  type LearningActivityCalendarMode,
  type LearningActivityCalendarDay,
  type LearningActivityType,
} from "@/entities/learning-activity";

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

const activityTypesByMode: Record<
  Exclude<LearningActivityCalendarMode, "all">,
  LearningActivityType[]
> = {
  dictation: [LEARNING_ACTIVITY_TYPES.DICTATION],
  mock: [LEARNING_ACTIVITY_TYPES.TEST_MOCK],
  part_practice: [
    LEARNING_ACTIVITY_TYPES.TEST_PART_PRACTICE,
    LEARNING_ACTIVITY_TYPES.TEST_PART_PRACTICE_REVIEW_WRONG,
  ],
  practice: [
    LEARNING_ACTIVITY_TYPES.TEST_PRACTICE,
    LEARNING_ACTIVITY_TYPES.TEST_REVIEW_WRONG,
  ],
  review: [LEARNING_ACTIVITY_TYPES.VOCABULARY_REVIEW],
};

export function getVietnamDateKey(date = new Date()) {
  return new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

export function getLearningActivityPeriods(days: LearningActivityCalendarDay[]) {
  return [
    ...new Set(
      days.map((day) => getLearningActivityPeriod(day.learnedOn)),
    ),
  ].sort((left, right) => right.localeCompare(left));
}

export function getLearningActivityPeriod(learnedOn: string) {
  const [year, month] = learnedOn.split("-").map(Number);

  return `${year}-${month <= 6 ? 1 : 2}`;
}

/** Periods the heatmap can navigate: activity periods plus the current half-year. Ascending. */
export function getNavigableLearningActivityPeriods(
  days: LearningActivityCalendarDay[],
  currentPeriod = getLearningActivityPeriod(getVietnamDateKey()),
) {
  return [
    ...new Set([...getLearningActivityPeriods(days), currentPeriod]),
  ].sort((left, right) => left.localeCompare(right));
}

export function formatLearningActivityPeriodRange(
  period: string,
  locale: "en" | "vi",
) {
  const [year, periodNumber] = period.split("-").map(Number);
  const startMonth = periodNumber === 1 ? 1 : 7;
  const endMonth = periodNumber === 1 ? 6 : 12;

  if (locale === "vi") {
    return `Thg ${startMonth} đến Thg ${endMonth} ${year}`;
  }

  const startLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, startMonth - 1, 1)));
  const endLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, endMonth - 1, 1)));

  return `${startLabel} to ${endLabel} ${year}`;
}

export function getLearningActivitySecondsByDate(
  days: LearningActivityCalendarDay[],
  mode: LearningActivityCalendarMode = LEARNING_ACTIVITY_CALENDAR_MODES.ALL,
) {
  const activityTypes =
    mode === LEARNING_ACTIVITY_CALENDAR_MODES.ALL
      ? null
      : activityTypesByMode[mode];
  const secondsByDate = new Map<string, number>();

  for (const day of days) {
    if (activityTypes && !activityTypes.includes(day.activityType)) continue;

    secondsByDate.set(
      day.learnedOn,
      (secondsByDate.get(day.learnedOn) ?? 0) + day.seconds,
    );
  }

  return secondsByDate;
}

export function getLearningActivityDaySeconds(
  days: LearningActivityCalendarDay[],
  learnedOn: string,
  mode: LearningActivityCalendarMode = LEARNING_ACTIVITY_CALENDAR_MODES.ALL,
) {
  return getLearningActivitySecondsByDate(days, mode).get(learnedOn) ?? 0;
}

export function getCurrentLearningStreak(days: LearningActivityCalendarDay[]) {
  const secondsByDay = new Map<string, number>();

  for (const day of days) {
    secondsByDay.set(
      day.learnedOn,
      (secondsByDay.get(day.learnedOn) ?? 0) + day.seconds,
    );
  }

  let cursor = getVietnamDateKey();
  if ((secondsByDay.get(cursor) ?? 0) < 60) {
    cursor = shiftDateKey(cursor, -1);
  }

  let streak = 0;
  while ((secondsByDay.get(cursor) ?? 0) >= 60) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}
