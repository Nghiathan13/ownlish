export function normalizeNullableString(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function normalizeAnswerKey(
  value: string | null | undefined,
): 'A' | 'B' | 'C' | 'D' | null {
  if (value == null) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized.length === 0) {
    return null;
  }

  if (
    normalized === 'A' ||
    normalized === 'B' ||
    normalized === 'C' ||
    normalized === 'D'
  ) {
    return normalized;
  }

  return null;
}

export function isValidAnswerKey(
  value: string | null | undefined,
): value is 'A' | 'B' | 'C' | 'D' | null {
  if (value == null) {
    return true;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized.length === 0) {
    return true;
  }

  return (
    normalized === 'A' ||
    normalized === 'B' ||
    normalized === 'C' ||
    normalized === 'D'
  );
}
