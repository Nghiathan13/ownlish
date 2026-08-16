export function normalizeDictationAnswer(value: string) {
  return value
    .trim()
    .split(/\s+/u)
    .map((token) =>
      Array.from(token.toLocaleLowerCase('en'))
        .filter((character) => /[\p{L}\p{N}]/u.test(character))
        .join(''),
    )
    .filter(Boolean)
    .join(' ');
}

export function isDictationAnswerCorrect(answer: string, transcript: string) {
  return (
    normalizeDictationAnswer(answer) === normalizeDictationAnswer(transcript)
  );
}
