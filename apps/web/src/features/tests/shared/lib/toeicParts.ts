export const ALL_TOEIC_PART_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

export type ToeicPartNumber = (typeof ALL_TOEIC_PART_NUMBERS)[number];

export function isToeicPartNumber(value: number): value is ToeicPartNumber {
  return ALL_TOEIC_PART_NUMBERS.includes(value as ToeicPartNumber);
}

export function normalizeSelectedParts(parts: number[] | null | undefined): number[] {
  if (parts == null) {
    return [...ALL_TOEIC_PART_NUMBERS];
  }

  if (parts.length === 0) {
    return [];
  }

  const uniqueParts = new Set<number>();

  for (const partNumber of parts) {
    if (isToeicPartNumber(partNumber)) {
      uniqueParts.add(partNumber);
    }
  }

  return Array.from(uniqueParts).sort((left, right) => left - right);
}

export function parseSelectedPartsParam(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = value
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter(isToeicPartNumber);

  if (parsed.length === 0) {
    return null;
  }

  return normalizeSelectedParts(parsed);
}

export function areAllPartsSelected(parts: number[]) {
  return ALL_TOEIC_PART_NUMBERS.every((partNumber) => parts.includes(partNumber));
}
