export const MOCK_PART_TIME_LIMIT_MINUTES: Record<number, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 15,
  5: 10,
  6: 10,
  7: 55,
};

export function getMockTimeLimitMinutes(partNumbers: number[]) {
  return partNumbers.reduce(
    (total, partNumber) => total + (MOCK_PART_TIME_LIMIT_MINUTES[partNumber] ?? 0),
    0,
  );
}

export function formatMockCountdown(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(remainingSeconds).padStart(2, "0"),
  ].join(":");
}
