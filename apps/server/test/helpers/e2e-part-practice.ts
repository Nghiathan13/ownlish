import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { withBearerAuth } from './e2e-toeic';

type SupertestServer = Parameters<typeof request>[0];

export const E2E_AGGREGATE_YEAR_A = 2098;
export const E2E_AGGREGATE_YEAR_B = 2099;
export const E2E_AGGREGATE_TEST_NUMBER = 88;

export type E2ePartPracticeFixture = {
  testAId: number;
  testAYear: number;
  testBId: number;
  testBYear: number;
  part1QuestionAId: number;
  part1QuestionBId: number;
};

export async function seedE2ePartPracticeTests(
  prisma: PrismaClient,
): Promise<E2ePartPracticeFixture> {
  await prisma.toeicTest.deleteMany({
    where: {
      testNumber: E2E_AGGREGATE_TEST_NUMBER,
      year: { in: [E2E_AGGREGATE_YEAR_A, E2E_AGGREGATE_YEAR_B] },
    },
  });

  const testA = await prisma.toeicTest.create({
    data: {
      year: E2E_AGGREGATE_YEAR_A,
      testNumber: E2E_AGGREGATE_TEST_NUMBER,
      parts: {
        create: {
          partNumber: 1,
          groups: {
            create: {
              questionStart: 1,
              questionEnd: 1,
              groupType: 'photo',
              content: 'Aggregate test A part 1',
              questions: {
                create: {
                  questionNumber: 1,
                  question: 'Aggregate A Q1',
                  optionA: 'Option A',
                  optionB: 'Option B',
                  optionC: 'Option C',
                  optionD: 'Option D',
                  answerKey: 'A',
                },
              },
            },
          },
        },
      },
    },
    include: {
      parts: {
        include: {
          groups: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });

  const testB = await prisma.toeicTest.create({
    data: {
      year: E2E_AGGREGATE_YEAR_B,
      testNumber: E2E_AGGREGATE_TEST_NUMBER,
      parts: {
        create: {
          partNumber: 1,
          groups: {
            create: {
              questionStart: 1,
              questionEnd: 1,
              groupType: 'photo',
              content: 'Aggregate test B part 1',
              questions: {
                create: {
                  questionNumber: 1,
                  question: 'Aggregate B Q1',
                  optionA: 'Option A',
                  optionB: 'Option B',
                  optionC: 'Option C',
                  optionD: 'Option D',
                  answerKey: 'B',
                },
              },
            },
          },
        },
      },
    },
    include: {
      parts: {
        include: {
          groups: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });

  const part1QuestionAId = testA.parts[0]?.groups[0]?.questions[0]?.id ?? null;
  const part1QuestionBId = testB.parts[0]?.groups[0]?.questions[0]?.id ?? null;

  if (!part1QuestionAId || !part1QuestionBId) {
    throw new Error('Failed to seed aggregate part practice tests.');
  }

  return {
    testAId: testA.id,
    testAYear: testA.year,
    testBId: testB.id,
    testBYear: testB.year,
    part1QuestionAId,
    part1QuestionBId,
  };
}

export async function cleanupE2ePartPracticeData(
  prisma: PrismaClient,
  email: string,
) {
  await prisma.user.deleteMany({
    where: { email },
  });
  await prisma.toeicTest.deleteMany({
    where: {
      testNumber: E2E_AGGREGATE_TEST_NUMBER,
      year: { in: [E2E_AGGREGATE_YEAR_A, E2E_AGGREGATE_YEAR_B] },
    },
  });
}

export type PartPracticeSummaryE2eBody = {
  items: Array<{
    partNumber: number;
    total: number;
    answered: number;
    correct: number;
    wrong: number;
  }>;
};

export type PartPracticeSessionE2eBody = {
  sessionId: string;
  mode: 'practice' | 'review_wrong';
  partNumber: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  groups: Array<{
    id: number;
    testId: number;
    year: number;
    testNumber: number;
    partNumber: number;
    groupStatus: string | null;
    questions: Array<{
      id: number;
      sessionQuestionNumber: number;
      selectedKey: string | null;
      status: string | null;
      isCorrect: boolean | null;
    }>;
  }>;
};

export function createPartPracticeRunRequest(
  server: SupertestServer,
  accessToken: string,
) {
  return request(server)
    .post('/tests/part-practice/runs')
    .set(withBearerAuth(accessToken));
}

export function getPartPracticeRunRequest(
  server: SupertestServer,
  accessToken: string,
  sessionId: string,
  params: { mode?: 'practice' | 'review_wrong' } = {},
) {
  const searchParams = new URLSearchParams();
  if (params.mode) {
    searchParams.set('mode', params.mode);
  }
  const query = searchParams.toString();
  const path = query
    ? `/tests/part-practice/runs/${sessionId}?${query}`
    : `/tests/part-practice/runs/${sessionId}`;

  return request(server).get(path).set(withBearerAuth(accessToken));
}

export function submitPartPracticeAnswerRequest(
  server: SupertestServer,
  accessToken: string,
  sessionId: string,
) {
  return request(server)
    .post(`/tests/part-practice/runs/${sessionId}/answers`)
    .set(withBearerAuth(accessToken));
}
