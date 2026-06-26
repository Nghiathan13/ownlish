import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import {
  E2E_TOEIC_TEST_NUMBER,
  E2E_TOEIC_YEAR,
  type E2eToeicFixture,
} from './e2e-toeic-types';

type SupertestServer = Parameters<typeof request>[0];

export function withBearerAuth(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export function buildToeicGetRunPath(
  sessionId: string,
  params: {
    parts?: string;
    mode?: 'practice' | 'review_wrong' | 'mock_test';
  } = {},
) {
  const searchParams = new URLSearchParams();

  if (params.parts) {
    searchParams.set('parts', params.parts);
  }

  if (params.mode) {
    searchParams.set('mode', params.mode);
  }

  const query = searchParams.toString();
  return query
    ? `/tests/runs/${sessionId}?${query}`
    : `/tests/runs/${sessionId}`;
}

export async function cleanupE2eToeicData(prisma: PrismaClient, email: string) {
  await prisma.user.deleteMany({
    where: { email },
  });
  await prisma.toeicTest.deleteMany({
    where: {
      year: E2E_TOEIC_YEAR,
      testNumber: E2E_TOEIC_TEST_NUMBER,
    },
  });
}

export async function seedE2eToeicTest(
  prisma: PrismaClient,
): Promise<E2eToeicFixture> {
  await prisma.toeicTest.deleteMany({
    where: {
      year: E2E_TOEIC_YEAR,
      testNumber: E2E_TOEIC_TEST_NUMBER,
    },
  });

  const test = await prisma.toeicTest.create({
    data: {
      year: E2E_TOEIC_YEAR,
      testNumber: E2E_TOEIC_TEST_NUMBER,
      parts: {
        create: [
          {
            partNumber: 1,
            groups: {
              create: {
                questionStart: 1,
                questionEnd: 1,
                groupType: 'photo',
                content: 'E2E part 1 photo',
                questions: {
                  create: {
                    questionNumber: 1,
                    question: 'E2E question 1',
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
          {
            partNumber: 2,
            groups: {
              create: {
                questionStart: 2,
                questionEnd: 2,
                groupType: 'photo',
                content: 'E2E part 2 photo',
                questions: {
                  create: {
                    questionNumber: 2,
                    question: 'E2E question 2',
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
        ],
      },
    },
    include: {
      parts: {
        orderBy: { partNumber: 'asc' },
        include: {
          groups: {
            include: {
              questions: {
                orderBy: { questionNumber: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  const part1Question = test.parts[0]?.groups[0]?.questions[0];
  const part2Question = test.parts[1]?.groups[0]?.questions[0];

  if (!part1Question || !part2Question) {
    throw new Error('Failed to seed E2E TOEIC questions.');
  }

  return {
    testId: test.id,
    year: test.year,
    part1QuestionId: part1Question.id,
    part2QuestionId: part2Question.id,
  };
}

export function createToeicRunsRequest(
  server: SupertestServer,
  accessToken: string,
) {
  return request(server).post('/tests/runs').set(withBearerAuth(accessToken));
}

export function getToeicRunRequest(
  server: SupertestServer,
  accessToken: string,
  sessionId: string,
  params: {
    parts?: string;
    mode?: 'practice' | 'review_wrong' | 'mock_test';
  } = {},
) {
  return request(server)
    .get(buildToeicGetRunPath(sessionId, params))
    .set(withBearerAuth(accessToken));
}

export function submitToeicAnswerRequest(
  server: SupertestServer,
  accessToken: string,
  sessionId: string,
) {
  return request(server)
    .post(`/tests/runs/${sessionId}/answers`)
    .set(withBearerAuth(accessToken));
}

export function finishToeicRunRequest(
  server: SupertestServer,
  accessToken: string,
  sessionId: string,
) {
  return request(server)
    .patch(`/tests/runs/${sessionId}/finish`)
    .set(withBearerAuth(accessToken));
}

export function expandToeicRunPartsRequest(
  server: SupertestServer,
  accessToken: string,
  sessionId: string,
  partNumbers: number[],
) {
  return request(server)
    .post(`/tests/runs/${sessionId}/expand-parts`)
    .set(withBearerAuth(accessToken))
    .send({ partNumbers });
}
