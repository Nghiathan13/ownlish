import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { env } from '../../../config/env';

type AnswerKey = 'A' | 'B' | 'C' | 'D';

type RawGradingIndex = {
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

export type CatalogQuestion = {
  testKey: string;
  partNumber: number;
  groupKey: string;
  questionKey: string;
  answerKey: AnswerKey;
};

async function readGradingIndex(url: string): Promise<RawGradingIndex> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }
    const value: unknown = await response.json();

    if (
      typeof value !== 'object' ||
      value === null ||
      !('schemaVersion' in value) ||
      !('tests' in value) ||
      value.schemaVersion !== 1 ||
      typeof value.tests !== 'object' ||
      value.tests === null
    ) {
      throw new Error('Invalid grading index.');
    }

    return value as RawGradingIndex;
  } catch (error) {
    throw new ServiceUnavailableException(
      `TOEIC grading index is unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}

@Injectable()
export class ToeicCatalogGradingIndex {
  private catalogPromise: Promise<RawGradingIndex> | null = null;
  private questions = new Map<string, CatalogQuestion>();

  private async getCatalog(): Promise<RawGradingIndex> {
    if (this.catalogPromise) {
      return this.catalogPromise;
    }

    if (!env.toeicGradingIndexUrl) {
      throw new ServiceUnavailableException(
        'TOEIC catalog runtime is not configured.',
      );
    }

    const catalogPromise = this.loadCatalog(env.toeicGradingIndexUrl);
    this.catalogPromise = catalogPromise;

    try {
      return await catalogPromise;
    } catch (error) {
      if (this.catalogPromise === catalogPromise) {
        this.catalogPromise = null;
      }
      throw error;
    }
  }

  private async loadCatalog(url: string): Promise<RawGradingIndex> {
    const catalog = await readGradingIndex(url);
    this.questions.clear();

    for (const [testKey, test] of Object.entries(catalog.tests)) {
      for (const [partKey, part] of Object.entries(test.parts)) {
        const partNumber = Number(partKey);
        if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 7) {
          throw new ServiceUnavailableException('Invalid TOEIC grading index.');
        }

        for (const [groupKey, questions] of Object.entries(part.groups)) {
          for (const [questionKey, answerKey] of Object.entries(questions)) {
            if (this.questions.has(questionKey)) {
              throw new ServiceUnavailableException(
                'TOEIC grading index contains duplicate question keys.',
              );
            }

            this.questions.set(questionKey, {
              testKey,
              partNumber,
              groupKey,
              questionKey,
              answerKey,
            });
          }
        }
      }
    }

    return catalog;
  }

  async getQuestion(questionKey: string): Promise<CatalogQuestion | null> {
    await this.getCatalog();
    return this.questions.get(questionKey) ?? null;
  }

  async hasTestParts(testKey: string, partNumbers: number[]): Promise<boolean> {
    const catalog = await this.getCatalog();
    const parts = catalog.tests[testKey]?.parts;

    return Boolean(
      parts && partNumbers.every((partNumber) => parts[String(partNumber)]),
    );
  }

  async hasPart(partNumber: number): Promise<boolean> {
    const catalog = await this.getCatalog();

    return Object.values(catalog.tests).some((test) =>
      Boolean(test.parts[String(partNumber)]),
    );
  }

  async getTestQuestions(
    testKey: string,
    partNumbers: number[],
  ): Promise<CatalogQuestion[]> {
    const catalog = await this.getCatalog();
    const test = catalog.tests[testKey];

    if (!test) {
      return [];
    }

    return partNumbers.flatMap((partNumber) =>
      Object.entries(test.parts[String(partNumber)]?.groups ?? {}).flatMap(
        ([groupKey, questions]) =>
          Object.entries(questions).map(([questionKey, answerKey]) => ({
            testKey,
            partNumber,
            groupKey,
            questionKey,
            answerKey,
          })),
      ),
    );
  }

  async getGroupQuestions(
    testKey: string,
    partNumber: number,
    groupKey: string,
  ): Promise<CatalogQuestion[]> {
    const catalog = await this.getCatalog();
    const questions =
      catalog.tests[testKey]?.parts[String(partNumber)]?.groups[groupKey];

    if (!questions) {
      return [];
    }

    return Object.entries(questions).map(([questionKey, answerKey]) => ({
      testKey,
      partNumber,
      groupKey,
      questionKey,
      answerKey,
    }));
  }
}
