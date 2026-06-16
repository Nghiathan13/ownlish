function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function buildToeicFileBaseName(
  testNumber: number,
  questionStart: number,
  questionEnd: number,
) {
  const prefix = `ets26_t${pad2(testNumber)}`;

  if (questionStart === questionEnd) {
    return `${prefix}_${pad2(questionStart)}`;
  }

  return `${prefix}_${pad2(questionStart)}-${pad2(questionEnd)}`;
}

export function buildAudioStoragePath(
  testNumber: number,
  questionStart: number,
  questionEnd: number,
) {
  const prefix = `ets26_t${pad2(testNumber)}`;
  const fileName = `${buildToeicFileBaseName(testNumber, questionStart, questionEnd)}.mp3`;
  return `toeic/2026/audio/${prefix}/${fileName}`;
}

export function buildImageStoragePath(
  testNumber: number,
  questionStart: number,
  questionEnd: number,
) {
  const prefix = `ets26_t${pad2(testNumber)}`;
  const fileName = `${buildToeicFileBaseName(testNumber, questionStart, questionEnd)}.png`;
  return `toeic/2026/image/${prefix}/${fileName}`;
}

export function partHasPerQuestionAudio(partNumber: number) {
  return partNumber === 1 || partNumber === 2;
}

export function partMayHaveImage(partNumber: number, questionStart: number, questionEnd: number) {
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

export function resolveGroupStoragePaths(
  testNumber: number,
  partNumber: number,
  questionStart: number,
  questionEnd: number,
) {
  let audioStoragePath: string | null = null;
  let imageStoragePath: string | null = null;

  if (partNumber >= 1 && partNumber <= 4) {
    if (partHasPerQuestionAudio(partNumber)) {
      audioStoragePath = buildAudioStoragePath(
        testNumber,
        questionStart,
        questionEnd,
      );
    } else {
      audioStoragePath = buildAudioStoragePath(
        testNumber,
        questionStart,
        questionEnd,
      );
    }
  }

  if (partMayHaveImage(partNumber, questionStart, questionEnd)) {
    imageStoragePath = buildImageStoragePath(
      testNumber,
      questionStart,
      questionEnd,
    );
  }

  return { audioStoragePath, imageStoragePath };
}
