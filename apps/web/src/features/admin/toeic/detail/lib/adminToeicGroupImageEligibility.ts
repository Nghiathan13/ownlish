// Mirrors engvocab-server/src/tests/lib/toeic-media-path.ts partMayHaveImage.
export function adminToeicGroupMayHaveImage(
  partNumber: number,
  questionStart: number,
  questionEnd: number,
) {
  if (partNumber === 1) {
    return true;
  }

  if (partNumber === 3) {
    return (
      (questionStart === 62 && questionEnd === 64) ||
      (questionStart === 65 && questionEnd === 67) ||
      (questionStart === 68 && questionEnd === 70)
    );
  }

  if (partNumber === 4) {
    return (
      (questionStart === 95 && questionEnd === 97) ||
      (questionStart === 98 && questionEnd === 100)
    );
  }

  return false;
}
