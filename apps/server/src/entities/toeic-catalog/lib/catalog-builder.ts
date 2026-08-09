import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';

type JsonRecord = Record<string, unknown>;
type AnswerKey = 'A' | 'B' | 'C' | 'D';

type CatalogPart = {
  number: number;
  path: string;
  questionCount: number;
  firstGroupKey: string;
};

type CatalogGroupMedia = {
  audio?: string;
  image?: string;
};

type CatalogPartArtifact = {
  path: string;
  document: JsonRecord;
};

type CatalogTest = {
  id: string;
  series: string;
  year: number;
  testNumber: number;
  complete: boolean;
  parts: CatalogPart[];
};

type PartPracticeManifestPart = {
  number: number;
  path: string;
  questionCount: number;
  firstGroupKey?: string;
  complete: boolean;
};

export type ToeicPartPracticeCatalog = {
  schemaVersion: 1;
  partNumber: number;
  totalQuestions: number;
  complete: boolean;
  groups: JsonRecord[];
};

export type ToeicCatalogManifest = {
  schemaVersion: 1;
  tests: CatalogTest[];
  partPractice: PartPracticeManifestPart[];
  mediaByGroupId: Record<string, CatalogGroupMedia>;
};

export type ToeicGradingIndex = {
  schemaVersion: 1;
  tests: Record<
    string,
    {
      parts: Record<
        string,
        {
          groups: Record<string, Record<string, AnswerKey>>;
        }
      >;
    }
  >;
};

export type BuildToeicCatalogResult = {
  manifest: ToeicCatalogManifest;
  gradingIndex: ToeicGradingIndex;
  partPractice: ToeicPartPracticeCatalog[];
  partArtifacts: CatalogPartArtifact[];
  incompleteTestIds: string[];
};

const PART_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;
const QUESTION_TOTALS: Record<number, number> = {
  1: 6,
  2: 25,
  3: 39,
  4: 30,
  5: 30,
  6: 16,
  7: 54,
};
const OPTION_KEYS: AnswerKey[] = ['A', 'B', 'C', 'D'];
const MEDIA_EXTENSIONS = new Set(['.mp3', '.png', '.avif']);

function fail(filePath: string, message: string): never {
  throw new Error(`${filePath}: ${message}`);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(
  value: unknown,
  filePath: string,
  field: string,
): JsonRecord {
  if (!isRecord(value)) {
    fail(filePath, `${field} must be an object`);
  }

  return value;
}

function requireString(
  value: unknown,
  filePath: string,
  field: string,
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(filePath, `${field} must be a non-empty string`);
  }

  return value;
}

function requireText(value: unknown, filePath: string, field: string): string {
  if (typeof value !== 'string') {
    fail(filePath, `${field} must be a string`);
  }

  return value;
}

function requireNumber(
  value: unknown,
  filePath: string,
  field: string,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    fail(filePath, `${field} must be a positive integer`);
  }

  return value;
}

function toRelativeAssetPath(
  value: unknown,
  filePath: string,
  field: string,
): string {
  const url = requireString(value, filePath, field);

  try {
    const pathname = new URL(url).pathname;
    const publicPrefix = '/storage/v1/object/public/';
    const publicIndex = pathname.indexOf(publicPrefix);

    if (publicIndex === -1) {
      return pathname.replace(/^\/+/, '');
    }

    const bucketAndPath = pathname
      .slice(publicIndex + publicPrefix.length)
      .split('/');
    bucketAndPath.shift();
    const assetPath = bucketAndPath.join('/');

    if (!assetPath) {
      fail(filePath, `${field} must contain an asset path`);
    }

    return assetPath;
  } catch {
    fail(filePath, `${field} must be a URL`);
  }
}

function separateMedia(
  value: JsonRecord,
  filePath: string,
): { content: JsonRecord; media: CatalogGroupMedia | null } {
  const { audioUrl, imageUrl, ...content } = value;
  const media: CatalogGroupMedia = {};

  if (audioUrl != null) {
    media.audio = toRelativeAssetPath(audioUrl, filePath, 'audioUrl');
  }
  if (imageUrl != null) {
    media.image = toRelativeAssetPath(imageUrl, filePath, 'imageUrl');
  }

  return {
    content,
    media: media.audio || media.image ? media : null,
  };
}

function requireBilingualContent(
  value: unknown,
  filePath: string,
  field: string,
): void {
  const content = requireRecord(value, filePath, field);
  requireString(content.en, filePath, `${field}.en`);
  requireString(content.vi, filePath, `${field}.vi`);
}

function requireOptions(
  value: unknown,
  filePath: string,
  expectedCount: number,
): void {
  if (!Array.isArray(value) || value.length !== expectedCount) {
    fail(filePath, `options must contain exactly ${expectedCount} items`);
  }

  value.forEach((option, index) => {
    const item = requireRecord(option, filePath, `options[${index}]`);
    const key = requireString(item.key, filePath, `options[${index}].key`);

    if (key !== OPTION_KEYS[index]) {
      fail(filePath, `options[${index}].key must be ${OPTION_KEYS[index]}`);
    }

    requireString(item.en, filePath, `options[${index}].en`);
    requireString(item.vi, filePath, `options[${index}].vi`);
  });
}

function readQuestion(
  value: unknown,
  filePath: string,
  expectedOptionCount: number,
  requiresPrompt: boolean,
): { id: string; number: number; answer: AnswerKey } {
  const question = requireRecord(value, filePath, 'question');
  const id = requireString(question.id, filePath, 'question.id');
  const number = requireNumber(question.number, filePath, 'question.number');
  const answer = requireString(question.answer, filePath, 'question.answer');

  if (!OPTION_KEYS.includes(answer as AnswerKey)) {
    fail(filePath, 'question.answer must be A, B, C, or D');
  }

  if (requiresPrompt) {
    requireBilingualContent(question.question, filePath, 'question.question');
  }

  requireOptions(question.options, filePath, expectedOptionCount);
  return { id, number, answer: answer as AnswerKey };
}

function requireTranscript(value: unknown, filePath: string): void {
  const transcript = requireRecord(value, filePath, 'transcript');

  for (const language of ['en', 'vi']) {
    if (!Array.isArray(transcript[language])) {
      fail(filePath, `transcript.${language} must be an array`);
    }

    transcript[language].forEach((segment, index) => {
      const item = requireRecord(
        segment,
        filePath,
        `transcript.${language}[${index}]`,
      );
      requireText(item.text, filePath, `transcript.${language}[${index}].text`);

      if (
        !Array.isArray(item.questionIds) ||
        item.questionIds.some((questionId) => typeof questionId !== 'string')
      ) {
        fail(
          filePath,
          `transcript.${language}[${index}].questionIds must be a string array`,
        );
      }
    });
  }
}

function readPart(
  filePath: string,
  partNumber: number,
  questionIds: Set<string>,
): {
  questionCount: number;
  groups: Record<string, Record<string, AnswerKey>>;
  practiceGroups: JsonRecord[];
  document: JsonRecord;
  mediaByGroupId: Record<string, CatalogGroupMedia>;
  groupIds: string[];
} {
  const raw = readFileSync(filePath, 'utf8').trim();

  if (!raw) {
    fail(filePath, 'part file is empty');
  }

  let document: unknown;
  try {
    document = JSON.parse(raw);
  } catch {
    fail(filePath, 'invalid JSON');
  }

  const root = requireRecord(document, filePath, 'root');
  const isFlatPart = partNumber === 1 || partNumber === 2 || partNumber === 5;
  const collectionKey = isFlatPart ? 'items' : 'groups';
  const collection = root[collectionKey];

  if (!Array.isArray(collection)) {
    fail(filePath, `${collectionKey} must be an array`);
  }

  const groups: Record<string, Record<string, AnswerKey>> = {};
  const practiceGroups: JsonRecord[] = [];
  const publishedCollection: JsonRecord[] = [];
  const mediaByGroupId: Record<string, CatalogGroupMedia> = {};
  const groupIds: string[] = [];
  let questionCount = 0;

  const addQuestion = (
    question: { id: string; number: number; answer: AnswerKey },
    groupId: string,
  ) => {
    if (questionIds.has(question.id)) {
      fail(filePath, `duplicate question id ${question.id}`);
    }

    if (!question.id.endsWith(`q${String(question.number).padStart(3, '0')}`)) {
      fail(
        filePath,
        `question id ${question.id} does not match question number ${question.number}`,
      );
    }

    questionIds.add(question.id);
    groups[groupId] ??= {};
    groups[groupId][question.id] = question.answer;
    questionCount += 1;
  };

  if (isFlatPart) {
    const expectedOptions = partNumber === 2 ? 3 : 4;

    collection.forEach((item) => {
      const record = requireRecord(item, filePath, 'item');

      if (partNumber === 1) {
        requireString(record.imageUrl, filePath, 'item.imageUrl');
        requireString(record.audioUrl, filePath, 'item.audioUrl');
      }

      if (partNumber === 2) {
        requireString(record.audioUrl, filePath, 'item.audioUrl');
      }

      const question = readQuestion(
        record,
        filePath,
        expectedOptions,
        partNumber !== 1,
      );
      addQuestion(question, question.id);
      groupIds.push(question.id);
      const { content: questionData, media } = separateMedia(record, filePath);
      const practiceGroup: JsonRecord = {
        id: question.id,
        questions: [questionData],
      };

      if (media) {
        mediaByGroupId[question.id] = media;
      }

      publishedCollection.push(questionData);
      practiceGroups.push(practiceGroup);
    });
  } else {
    collection.forEach((item) => {
      const group = requireRecord(item, filePath, 'group');
      const groupId = requireString(group.id, filePath, 'group.id');

      if (groups[groupId]) {
        fail(filePath, `duplicate group id ${groupId}`);
      }

      if (partNumber === 3 || partNumber === 4) {
        requireString(group.audioUrl, filePath, 'group.audioUrl');
        requireTranscript(group.transcript, filePath);
      }

      if (partNumber === 6) {
        requireString(group.kind, filePath, 'group.kind');
        requireBilingualContent(group.content, filePath, 'group.content');
      }

      if (partNumber === 7) {
        if (!Array.isArray(group.documents) || group.documents.length === 0) {
          fail(filePath, 'group.documents must be a non-empty array');
        }

        group.documents.forEach((document, index) => {
          const item = requireRecord(
            document,
            filePath,
            `group.documents[${index}]`,
          );
          requireString(item.kind, filePath, `group.documents[${index}].kind`);
          requireBilingualContent(
            item.content,
            filePath,
            `group.documents[${index}].content`,
          );
        });
      }

      if (!Array.isArray(group.questions) || group.questions.length === 0) {
        fail(filePath, 'group.questions must be a non-empty array');
      }

      group.questions.forEach((question) => {
        addQuestion(
          readQuestion(question, filePath, 4, partNumber !== 6),
          groupId,
        );
      });
      groupIds.push(groupId);
      const { content: publishedGroup, media } = separateMedia(group, filePath);
      if (media) {
        mediaByGroupId[groupId] = media;
      }
      publishedCollection.push(publishedGroup);
      practiceGroups.push(publishedGroup);
    });
  }

  if (questionCount !== QUESTION_TOTALS[partNumber]) {
    fail(
      filePath,
      `expected ${QUESTION_TOTALS[partNumber]} questions, found ${questionCount}`,
    );
  }

  return {
    questionCount,
    groups,
    practiceGroups,
    document: { [collectionKey]: publishedCollection },
    mediaByGroupId,
    groupIds,
  };
}

function parseSeries(
  directoryName: string,
): { series: string; year: number } | null {
  const match = /^(ets|ybm)_(\d{2})$/.exec(directoryName);
  if (!match) {
    return null;
  }

  return {
    series: directoryName,
    year: 2000 + Number(match[2]),
  };
}

function parseTestNumber(directoryName: string): number | null {
  const match = /^test_(\d{2})$/.exec(directoryName);
  return match ? Number(match[1]) : null;
}

export function buildToeicCatalog(
  sourceDirectory: string,
): BuildToeicCatalogResult {
  const partPractice: ToeicPartPracticeCatalog[] = PART_NUMBERS.map(
    (partNumber) => ({
      schemaVersion: 1 as const,
      partNumber,
      totalQuestions: 0,
      complete: false,
      groups: [],
    }),
  );
  const manifest: ToeicCatalogManifest = {
    schemaVersion: 1,
    tests: [],
    partPractice: [],
    mediaByGroupId: {},
  };
  const gradingIndex: ToeicGradingIndex = {
    schemaVersion: 1,
    tests: {},
  };
  const questionIds = new Set<string>();
  const groupIds = new Set<string>();
  const partArtifacts: CatalogPartArtifact[] = [];
  const errors: string[] = [];

  for (const seriesDirectory of readdirSync(sourceDirectory, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))) {
    const series = parseSeries(seriesDirectory.name);
    if (!series) {
      continue;
    }

    const seriesPath = join(sourceDirectory, seriesDirectory.name);
    for (const testDirectory of readdirSync(seriesPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name))) {
      const testNumber = parseTestNumber(testDirectory.name);
      if (!testNumber) {
        continue;
      }

      const testId = `${series.series.replace('_', '')}-t${String(testNumber).padStart(2, '0')}`;
      const testPath = join(seriesPath, testDirectory.name);
      const parts: CatalogPart[] = [];
      const indexParts: ToeicGradingIndex['tests'][string]['parts'] = {};

      for (const partNumber of PART_NUMBERS) {
        const partPath = join(testPath, `part_${partNumber}.json`);
        if (
          !existsSync(partPath) ||
          readFileSync(partPath, 'utf8').trim() === ''
        ) {
          continue;
        }

        const partQuestionIds = new Set<string>();
        let part: ReturnType<typeof readPart>;

        try {
          part = readPart(partPath, partNumber, partQuestionIds);
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
          continue;
        }

        const duplicateQuestionId = [...partQuestionIds].find((questionId) =>
          questionIds.has(questionId),
        );
        if (duplicateQuestionId) {
          errors.push(
            `${partPath}: duplicate question id ${duplicateQuestionId}`,
          );
          continue;
        }

        const duplicateGroupId = part.groupIds.find((groupId) =>
          groupIds.has(groupId),
        );
        if (duplicateGroupId) {
          errors.push(`${partPath}: duplicate group id ${duplicateGroupId}`);
          continue;
        }

        partQuestionIds.forEach((questionId) => questionIds.add(questionId));
        part.groupIds.forEach((groupId) => groupIds.add(groupId));
        Object.assign(manifest.mediaByGroupId, part.mediaByGroupId);
        const relativePartPath = relative(sourceDirectory, partPath).replaceAll(
          '\\',
          '/',
        );
        parts.push({
          number: partNumber,
          path: relativePartPath,
          questionCount: part.questionCount,
          firstGroupKey: part.groupIds[0],
        });
        partArtifacts.push({ path: relativePartPath, document: part.document });
        indexParts[String(partNumber)] = { groups: part.groups };

        const practiceCatalog = partPractice[partNumber - 1];
        practiceCatalog.totalQuestions += part.questionCount;
        practiceCatalog.groups.push(
          ...part.practiceGroups.map((group) => ({
            ...group,
            test: {
              id: testId,
              series: series.series,
              year: series.year,
              testNumber,
            },
          })),
        );
      }

      if (parts.length === 0) {
        continue;
      }

      manifest.tests.push({
        id: testId,
        series: series.series,
        year: series.year,
        testNumber,
        complete: parts.length === PART_NUMBERS.length,
        parts,
      });
      gradingIndex.tests[testId] = { parts: indexParts };
    }
  }

  if (errors.length > 0) {
    throw new Error(`Catalog validation failed:\n- ${errors.join('\n- ')}`);
  }

  partPractice.forEach((part) => {
    const testIds = new Set(
      part.groups.flatMap((group) =>
        isRecord(group.test) && typeof group.test.id === 'string'
          ? [group.test.id]
          : [],
      ),
    );
    part.complete =
      manifest.tests.length > 0 &&
      part.groups.length > 0 &&
      testIds.size === manifest.tests.length;
  });
  manifest.partPractice = partPractice.map((part) => ({
    number: part.partNumber,
    path: `part-practice/part_${part.partNumber}.json`,
    questionCount: part.totalQuestions,
    ...(part.groups[0] && typeof part.groups[0].id === 'string'
      ? { firstGroupKey: part.groups[0].id }
      : {}),
    complete: part.complete,
  }));

  const incompleteTestIds = manifest.tests
    .filter((test) => !test.complete)
    .map((test) => test.id);

  return {
    manifest,
    gradingIndex,
    partPractice,
    partArtifacts,
    incompleteTestIds,
  };
}

export function writeToeicCatalogArtifacts(
  outputDirectory: string,
  result: BuildToeicCatalogResult,
): void {
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(
    join(outputDirectory, 'catalog.json'),
    `${JSON.stringify(result.manifest, null, 2)}\n`,
  );
  const serverDirectory = join(outputDirectory, 'server');
  mkdirSync(serverDirectory, { recursive: true });
  writeFileSync(
    join(serverDirectory, 'grading-index.json'),
    `${JSON.stringify(result.gradingIndex, null, 2)}\n`,
  );
  result.partArtifacts.forEach((artifact) => {
    const outputPath = join(outputDirectory, artifact.path);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(
      outputPath,
      `${JSON.stringify(artifact.document, null, 2)}\n`,
    );
  });
  const partPracticeDirectory = join(outputDirectory, 'part-practice');
  mkdirSync(partPracticeDirectory, { recursive: true });
  result.partPractice.forEach((part) => {
    writeFileSync(
      join(partPracticeDirectory, `part_${part.partNumber}.json`),
      `${JSON.stringify(part, null, 2)}\n`,
    );
  });
}

export function copyToeicCatalogMediaArtifacts(
  sourceDirectory: string,
  outputDirectory: string,
): void {
  const copyDirectory = (directory: string): void => {
    readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const sourcePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        copyDirectory(sourcePath);
        return;
      }

      if (!entry.isFile() || !MEDIA_EXTENSIONS.has(extname(entry.name))) {
        return;
      }

      const outputPath = join(
        outputDirectory,
        relative(sourceDirectory, sourcePath),
      );
      mkdirSync(dirname(outputPath), { recursive: true });
      copyFileSync(sourcePath, outputPath);
    });
  };

  copyDirectory(sourceDirectory);
}
