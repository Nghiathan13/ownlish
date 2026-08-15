const dictionaryWordPattern = /^[a-z]+$/;

export function normalizeDictionaryLookup(value: string): string | null {
  const normalized = value.trim().toLowerCase();

  return dictionaryWordPattern.test(normalized) ? normalized : null;
}
