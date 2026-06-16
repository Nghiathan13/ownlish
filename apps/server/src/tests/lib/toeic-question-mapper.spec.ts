import { isToeicQuestionOptionKey, parseAnswerKey } from './toeic-question-mapper';

describe('toeic-question-mapper answer key', () => {
  it('parses valid answer keys', () => {
    expect(parseAnswerKey('b')).toBe('B');
    expect(parseAnswerKey(' D ')).toBe('D');
  });

  it('rejects invalid answer keys', () => {
    expect(parseAnswerKey('')).toBeNull();
    expect(parseAnswerKey('E')).toBeNull();
    expect(parseAnswerKey(null)).toBeNull();
  });

  it('checks option key membership', () => {
    expect(isToeicQuestionOptionKey('C')).toBe(true);
    expect(isToeicQuestionOptionKey('Z')).toBe(false);
  });
});
