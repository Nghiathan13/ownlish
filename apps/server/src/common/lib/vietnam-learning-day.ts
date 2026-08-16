const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getVietnamLearningDayStart(date: Date) {
  const localDate = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);

  return new Date(
    Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
    ) - VIETNAM_UTC_OFFSET_MS,
  );
}

export function getVietnamLearningDay(date: Date) {
  const localDate = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);

  return new Date(
    Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
    ),
  );
}

export function getVietnamLearningDateKey(date: Date) {
  return getVietnamLearningDay(date).toISOString().slice(0, 10);
}
