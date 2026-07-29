import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { ToeicCatalogGradingIndex } from '../src/entities/toeic-catalog/lib/grading-index';
import { registerE2eUser } from './helpers/e2e-auth';
import { getE2ePrisma } from './helpers/e2e-prisma';
import { parseResponseBody } from './helpers/parse-response-body';

type RuntimeRunResponse = {
  sessionId: string;
  mode: 'practice' | 'mock_test';
  selectedParts: number[];
  correctCount: number;
  wrongCount: number;
  answers: Array<{
    questionKey: string;
    selectedKey: string;
    status: 'selected' | 'right' | 'wrong';
  }>;
};

const testKey = 'ets26-t01';
const questionKey = 'ets26-t01-p1-q001';
const email = 'toeic-runtime-e2e@example.com';

describe('ToeicRuntimeController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const gradingIndex = {
    hasTestParts: jest.fn().mockResolvedValue(true),
    hasPart: jest.fn().mockResolvedValue(true),
    getQuestion: jest.fn().mockResolvedValue({
      testKey,
      partNumber: 1,
      groupKey: 'g001',
      questionKey,
      answerKey: 'A',
    }),
    getGroupQuestions: jest.fn().mockResolvedValue([
      {
        testKey,
        partNumber: 1,
        groupKey: 'g001',
        questionKey,
        answerKey: 'A',
      },
    ]),
    getTestQuestions: jest.fn().mockResolvedValue([
      {
        testKey,
        partNumber: 1,
        groupKey: 'g001',
        questionKey,
        answerKey: 'A',
      },
    ]),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ToeicCatalogGradingIndex)
      .useValue(gradingIndex)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = getE2ePrisma(app);
    await prisma.user.deleteMany({ where: { email } });
    await app.init();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
    jest.clearAllMocks();
  });

  it('persists runtime practice answers and resumes the same test run', async () => {
    const server = app.getHttpServer();
    const auth = await registerE2eUser(server, {
      email,
      password: 'test123456',
      name: 'TOEIC Runtime',
    });

    const createResponse = await request(server)
      .post('/tests/runtime/test-runs')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ testKey, partNumbers: [1], mode: 'practice' })
      .expect(201);
    const created = parseResponseBody<RuntimeRunResponse>(createResponse);

    await request(server)
      .post(`/tests/runtime/runs/${created.sessionId}/answers`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ questionKey, selectedKey: 'A' })
      .expect(201)
      .expect({ graded: true });

    const resumedResponse = await request(server)
      .post('/tests/runtime/test-runs')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ testKey, partNumbers: [1], mode: 'practice' })
      .expect(201);
    const resumed = parseResponseBody<RuntimeRunResponse>(resumedResponse);

    expect(resumed.sessionId).toBe(created.sessionId);
    expect(resumed.correctCount).toBe(1);
    expect(resumed.wrongCount).toBe(0);
    expect(resumed.answers).toEqual([
      { questionKey, selectedKey: 'A', status: 'right' },
    ]);
  });

  it('creates a mock run with its configured timer', async () => {
    const server = app.getHttpServer();
    const auth = await registerE2eUser(server, {
      email,
      password: 'test123456',
      name: 'TOEIC Runtime',
    });

    const response = await request(server)
      .post('/tests/runtime/test-runs')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        testKey,
        partNumbers: [1],
        mode: 'mock_test',
        timeLimitMinutes: 7,
      })
      .expect(201);
    const run = parseResponseBody<
      RuntimeRunResponse & {
        timer: { timeLimitSeconds: number; remainingSeconds: number };
      }
    >(response);

    expect(run.mode).toBe('mock_test');
    expect(run.timer).toEqual({ timeLimitSeconds: 420, remainingSeconds: 420 });
  });
});
