function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function buildToeicEditionPrefix(year: number) {
  if (year === 2025) {
    return 'ybm25';
  }

  return `ets${String(year).slice(-2)}`;
}

export function buildToeicTestFolderPrefix(year: number, testNumber: number) {
  return `${buildToeicEditionPrefix(year)}_t${pad2(testNumber)}`;
}

export function buildToeicFileBaseName(
  year: number,
  testNumber: number,
  questionStart: number,
  questionEnd: number,
) {
  const prefix = buildToeicTestFolderPrefix(year, testNumber);

  if (questionStart === questionEnd) {
    return `${prefix}_${pad2(questionStart)}`;
  }

  return `${prefix}_${pad2(questionStart)}-${pad2(questionEnd)}`;
}

export function buildAudioStoragePath(
  year: number,
  testNumber: number,
  questionStart: number,
  questionEnd: number,
) {
  const folderPrefix = buildToeicTestFolderPrefix(year, testNumber);
  const fileName = `${buildToeicFileBaseName(year, testNumber, questionStart, questionEnd)}.mp3`;
  return `toeic/${year}/audio/${folderPrefix}/${fileName}`;
}

export function buildImageStoragePath(
  year: number,
  testNumber: number,
  questionStart: number,
  questionEnd: number,
) {
  const folderPrefix = buildToeicTestFolderPrefix(year, testNumber);
  const fileName = `${buildToeicFileBaseName(year, testNumber, questionStart, questionEnd)}.png`;
  return `toeic/${year}/image/${folderPrefix}/${fileName}`;
}

export function partHasPerQuestionAudio(partNumber: number) {
  return partNumber === 1 || partNumber === 2;
}

export function partMayHaveAudio(partNumber: number) {
  return partNumber >= 1 && partNumber <= 4;
}

export function partMayHaveImage(
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

export function resolveGroupStoragePaths(
  year: number,
  testNumber: number,
  partNumber: number,
  questionStart: number,
  questionEnd: number,
) {
  let audioStoragePath: string | null = null;
  let imageStoragePath: string | null = null;

  if (partNumber >= 1 && partNumber <= 4) {
    if (partMayHaveAudio(partNumber)) {
      audioStoragePath = buildAudioStoragePath(
        year,
        testNumber,
        questionStart,
        questionEnd,
      );
    }
  }

  if (partMayHaveImage(partNumber, questionStart, questionEnd)) {
    imageStoragePath = buildImageStoragePath(
      year,
      testNumber,
      questionStart,
      questionEnd,
    );
  }

  return { audioStoragePath, imageStoragePath };
}
