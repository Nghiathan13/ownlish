export function normalizeDictationAnswer(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .toLocaleLowerCase("en")
    .replace(/\s+/g, " ")
    .trim();
}

export function isDictationAnswerCorrect(answer: string, expected: string) {
  return normalizeDictationAnswer(answer) === normalizeDictationAnswer(expected);
}
