import {
  isValidAnswerKey,
  normalizeAnswerKey,
  normalizeNullableString,
} from './toeic-group-raw.normalize';

describe('toeic-group-raw.normalize', () => {
  it('normalizes empty strings to null', () => {
    expect(normalizeNullableString('')).toBeNull();
    expect(normalizeNullableString('  ')).toBeNull();
    expect(normalizeNullableString('text')).toBe('text');
    expect(normalizeNullableString(null)).toBeNull();
  });

  it('normalizes answer keys', () => {
    expect(normalizeAnswerKey('a')).toBe('A');
    expect(normalizeAnswerKey('')).toBeNull();
    expect(normalizeAnswerKey(null)).toBeNull();
    expect(normalizeAnswerKey('E')).toBeNull();
  });

  it('validates answer keys', () => {
    expect(isValidAnswerKey('A')).toBe(true);
    expect(isValidAnswerKey('')).toBe(true);
    expect(isValidAnswerKey(null)).toBe(true);
    expect(isValidAnswerKey('E')).toBe(false);
  });
});
