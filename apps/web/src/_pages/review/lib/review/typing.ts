export function normalizeTypingAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getTypingAnswer(word: string) {
  return word.replace(/\s*\([^)]*\)/g, "").trim().replace(/\s+/g, " ");
}

export function compareTypingAnswer(word: string, submittedAnswer: string) {
  return (
    normalizeTypingAnswer(submittedAnswer) ===
    normalizeTypingAnswer(getTypingAnswer(word))
  );
}
