import { normalizeWord } from './normalize-word';

describe('normalizeWord', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeWord('  hello  ')).toBe('hello');
  });

  it('lowercases the word', () => {
    expect(normalizeWord('HELLO')).toBe('hello');
  });

  it('keeps inner spaces for phrases', () => {
    expect(normalizeWord('Look Up')).toBe('look up');
  });
});
