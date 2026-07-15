import { type ToeicQuestion } from '@prisma/client';
import type { PartPracticeRunForResponse } from '../lib/toeic-part-practice/session.types';
import { buildToeicQuestion } from './toeic-run.fixtures';

export function buildPartPracticeRunForResponse(
  overrides: Partial<PartPracticeRunForResponse> = {},
): PartPracticeRunForResponse {
  return {
    id: 'part-practice-run-id',
    partNumber: 1,
    totalRight: 0,
    totalWrong: 0,
    ...overrides,
  };
}

type CatalogGroupForPartPractice = {
  id: number;
  questionStart: number;
  questionEnd: number;
  groupType: string | null;
  accent: string | null;
  content: string | null;
  contentVi: string | null;
  audioStoragePath: string | null;
  imageStoragePath: string | null;
  testPart: {
    partNumber: number;
    testId: number;
    test: { year: number; testNumber: number };
  };
  questions: ToeicQuestion[];
};

export function buildCatalogGroupForPartPractice(
  overrides: {
    id?: number;
    questionStart?: number;
    questionEnd?: number;
    partNumber?: number;
    testId?: number;
    year?: number;
    testNumber?: number;
    groupType?: string | null;
    content?: string | null;
    audioStoragePath?: string | null;
    question?: Partial<ToeicQuestion> & { id: number };
  } = {},
): CatalogGroupForPartPractice {
  const groupId = overrides.id ?? 101;
  const question = buildToeicQuestion({
    id: overrides.question?.id ?? 1001,
    groupId,
    questionNumber: overrides.questionStart ?? 1,
    ...overrides.question,
  });

  return {
    id: groupId,
    questionStart: overrides.questionStart ?? 1,
    questionEnd: overrides.questionEnd ?? 1,
    groupType: overrides.groupType ?? 'photo',
    accent: null,
    content: overrides.content ?? 'Look at the picture.',
    contentVi: null,
    audioStoragePath: overrides.audioStoragePath ?? 'audio/part-1.mp3',
    imageStoragePath: null,
    testPart: {
      partNumber: overrides.partNumber ?? 1,
      testId: overrides.testId ?? 1,
      test: {
        year: overrides.year ?? 2026,
        testNumber: overrides.testNumber ?? 1,
      },
    },
    questions: [question],
  };
}

export type { CatalogGroupForPartPractice };
