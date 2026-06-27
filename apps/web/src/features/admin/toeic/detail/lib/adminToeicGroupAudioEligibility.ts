// Mirrors engvocab-server/src/tests/lib/toeic-media-path.ts partMayHaveAudio.
export function adminToeicGroupMayHaveAudio(partNumber: number) {
  return partNumber >= 1 && partNumber <= 4;
}
