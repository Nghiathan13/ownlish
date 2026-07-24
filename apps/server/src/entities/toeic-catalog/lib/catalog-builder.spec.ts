import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  buildToeicCatalog,
  copyToeicCatalogMediaArtifacts,
  writeToeicCatalogArtifacts,
} from './catalog-builder';

function option(key: 'A' | 'B' | 'C' | 'D') {
  return { key, en: `Option ${key}`, vi: `Lựa chọn ${key}` };
}

function question(number: number) {
  return {
    id: `ets26-t01-p1-q${String(number).padStart(3, '0')}`,
    number,
    imageUrl: `https://example.com/${number}.avif`,
    audioUrl: `https://example.com/${number}.mp3`,
    options: [option('A'), option('B'), option('C'), option('D')],
    answer: 'A',
  };
}

describe('buildToeicCatalog', () => {
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    temporaryDirectories.splice(0).forEach((directory) => {
      rmSync(directory, { recursive: true, force: true });
    });
  });

  it('builds a partial manifest and grading index from valid part JSON', () => {
    const root = mkdtempSync(join(tmpdir(), 'engvocab-toeic-'));
    temporaryDirectories.push(root);
    const testDirectory = join(root, 'ets_26', 'test_01');
    mkdirSync(testDirectory, { recursive: true });
    writeFileSync(
      join(testDirectory, 'part_1.json'),
      JSON.stringify({ items: [1, 2, 3, 4, 5, 6].map(question) }),
    );

    const result = buildToeicCatalog(root);
    expect(result.manifest).toEqual({
      schemaVersion: 1,
      tests: [
        {
          id: 'ets26-t01',
          series: 'ets_26',
          year: 2026,
          testNumber: 1,
          complete: false,
          parts: [
            {
              number: 1,
              path: 'ets_26/test_01/part_1.json',
              questionCount: 6,
              firstGroupKey: 'ets26-t01-p1-q001',
            },
          ],
        },
      ],
      partPractice: [
        {
          number: 1,
          path: 'part-practice/part_1.json',
          questionCount: 6,
          firstGroupKey: 'ets26-t01-p1-q001',
          complete: true,
        },
        {
          number: 2,
          path: 'part-practice/part_2.json',
          questionCount: 0,
          complete: false,
        },
        {
          number: 3,
          path: 'part-practice/part_3.json',
          questionCount: 0,
          complete: false,
        },
        {
          number: 4,
          path: 'part-practice/part_4.json',
          questionCount: 0,
          complete: false,
        },
        {
          number: 5,
          path: 'part-practice/part_5.json',
          questionCount: 0,
          complete: false,
        },
        {
          number: 6,
          path: 'part-practice/part_6.json',
          questionCount: 0,
          complete: false,
        },
        {
          number: 7,
          path: 'part-practice/part_7.json',
          questionCount: 0,
          complete: false,
        },
      ],
      mediaByGroupId: {
        'ets26-t01-p1-q001': { audio: '1.mp3', image: '1.avif' },
        'ets26-t01-p1-q002': { audio: '2.mp3', image: '2.avif' },
        'ets26-t01-p1-q003': { audio: '3.mp3', image: '3.avif' },
        'ets26-t01-p1-q004': { audio: '4.mp3', image: '4.avif' },
        'ets26-t01-p1-q005': { audio: '5.mp3', image: '5.avif' },
        'ets26-t01-p1-q006': { audio: '6.mp3', image: '6.avif' },
      },
    });
    expect(result.gradingIndex.tests['ets26-t01'].parts['1'].groups).toEqual({
      'ets26-t01-p1-q001': { 'ets26-t01-p1-q001': 'A' },
      'ets26-t01-p1-q002': { 'ets26-t01-p1-q002': 'A' },
      'ets26-t01-p1-q003': { 'ets26-t01-p1-q003': 'A' },
      'ets26-t01-p1-q004': { 'ets26-t01-p1-q004': 'A' },
      'ets26-t01-p1-q005': { 'ets26-t01-p1-q005': 'A' },
      'ets26-t01-p1-q006': { 'ets26-t01-p1-q006': 'A' },
    });
    expect(result.incompleteTestIds).toEqual(['ets26-t01']);
    expect(result.partPractice[0]).toMatchObject({
      partNumber: 1,
      totalQuestions: 6,
      complete: true,
    });
    expect(result.partPractice[0].groups[0].id).toBe('ets26-t01-p1-q001');
    expect(result.partPractice[0].groups[0].test).toStrictEqual({
      id: 'ets26-t01',
      series: 'ets_26',
      year: 2026,
      testNumber: 1,
    });
    const partOneItems = result.partArtifacts[0].document.items as Array<
      Record<string, unknown>
    >;
    expect(partOneItems[0].id).toBe('ets26-t01-p1-q001');
    expect(partOneItems[0]).not.toHaveProperty('audioUrl');
    expect(result.partPractice[0].groups[0]).not.toHaveProperty('imageUrl');
  });

  it('writes both generated artifacts', () => {
    const root = mkdtempSync(join(tmpdir(), 'engvocab-toeic-'));
    temporaryDirectories.push(root);
    const testDirectory = join(root, 'ets_26', 'test_01');
    const outputDirectory = join(root, 'out');
    mkdirSync(testDirectory, { recursive: true });
    writeFileSync(
      join(testDirectory, 'part_1.json'),
      JSON.stringify({ items: [1, 2, 3, 4, 5, 6].map(question) }),
    );

    const result = buildToeicCatalog(root);
    writeToeicCatalogArtifacts(outputDirectory, result);

    expect(
      JSON.parse(readFileSync(join(outputDirectory, 'catalog.json'), 'utf8')),
    ).toMatchObject({ schemaVersion: 1 });
    expect(
      JSON.parse(
        readFileSync(
          join(outputDirectory, 'part-practice/part_1.json'),
          'utf8',
        ),
      ),
    ).toMatchObject({ partNumber: 1, totalQuestions: 6 });
    expect(
      JSON.parse(
        readFileSync(
          join(outputDirectory, 'server', 'grading-index.json'),
          'utf8',
        ),
      ),
    ).toMatchObject({ schemaVersion: 1 });
    const writtenPart = JSON.parse(
      readFileSync(join(outputDirectory, 'ets_26/test_01/part_1.json'), 'utf8'),
    ) as { items: Array<Record<string, unknown>> };
    expect(writtenPart.items[0]).not.toHaveProperty('audioUrl');
  });

  it('copies source media while preserving its relative paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'engvocab-toeic-'));
    temporaryDirectories.push(root);
    const sourceDirectory = join(root, 'source');
    const outputDirectory = join(root, 'out');
    const audioPath = join(sourceDirectory, 'ets_26/test_01/audio/001.mp3');
    const imagePath = join(sourceDirectory, 'ets_26/test_01/image/001.avif');
    const ignoredPath = join(sourceDirectory, 'ets_26/test_01/part_1.json');

    mkdirSync(dirname(audioPath), { recursive: true });
    mkdirSync(dirname(imagePath), { recursive: true });
    writeFileSync(audioPath, 'audio');
    writeFileSync(imagePath, 'image');
    writeFileSync(ignoredPath, '{}');

    copyToeicCatalogMediaArtifacts(sourceDirectory, outputDirectory);

    expect(
      readFileSync(
        join(outputDirectory, 'ets_26/test_01/audio/001.mp3'),
        'utf8',
      ),
    ).toBe('audio');
    expect(
      readFileSync(
        join(outputDirectory, 'ets_26/test_01/image/001.avif'),
        'utf8',
      ),
    ).toBe('image');
    expect(() =>
      readFileSync(join(outputDirectory, 'ets_26/test_01/part_1.json')),
    ).toThrow();
  });

  it('reports a missing option translation', () => {
    const root = mkdtempSync(join(tmpdir(), 'engvocab-toeic-'));
    temporaryDirectories.push(root);
    const testDirectory = join(root, 'ets_26', 'test_01');
    mkdirSync(testDirectory, { recursive: true });
    const items = [1, 2, 3, 4, 5, 6].map(question);
    items[0].options[3].vi = '';
    writeFileSync(
      join(testDirectory, 'part_1.json'),
      JSON.stringify({ items }),
    );

    expect(() => buildToeicCatalog(root)).toThrow(
      'options[3].vi must be a non-empty string',
    );
  });
});
