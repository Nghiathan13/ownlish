import {
  isDictationAnswerCorrect,
  normalizeDictationAnswer,
} from './dictation-answer';

describe('Dictation answer verification', () => {
  it('uses the same punctuation-insensitive token normalization as the study UI', () => {
    expect(normalizeDictationAnswer("Don't—stop, now!")).toBe('dontstop now');
    expect(isDictationAnswerCorrect('DON’T stop now', "Don't stop, now!")).toBe(
      true,
    );
  });

  it('requires every normalized token to match the approved transcript', () => {
    expect(isDictationAnswerCorrect('don stop now', "Don't stop now")).toBe(
      false,
    );
  });
});
