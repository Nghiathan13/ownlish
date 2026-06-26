import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { registerE2eUser } from './helpers/e2e-auth';
import {
  cleanupE2ePartPracticeData,
  createPartPracticeRunRequest,
  E2E_AGGREGATE_YEAR_B,
  getPartPracticeRunRequest,
  seedE2ePartPracticeTests,
  submitPartPracticeAnswerRequest,
  type E2ePartPracticeFixture,
  type PartPracticeSessionE2eBody,
  type PartPracticeSummaryE2eBody,
} from './helpers/e2e-part-practice';
import {
  cleanupE2eToeicData,
  createToeicRunsRequest,
  seedE2eToeicTest,
  submitToeicAnswerRequest,
  withBearerAuth,
} from './helpers/e2e-toeic';
import type {
  E2eToeicFixture,
  SubmitToeicAnswerE2eBody,
  ToeicSessionE2eBody,
  ToeicTestListE2eBody,
} from './helpers/e2e-toeic-types';
import { getE2ePrisma } from './helpers/e2e-prisma';
import { parseResponseBody } from './helpers/parse-response-body';

describe('PartPracticeController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let accessToken: string;
  let aggregateFixture: E2ePartPracticeFixture;
  let testFixture: E2eToeicFixture;

  const email = 'part-practice-e2e@example.com';
  const password = 'test123456';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    prisma = getE2ePrisma(app);

    await cleanupE2ePartPracticeData(prisma, email);
    await cleanupE2eToeicData(prisma, email);
    aggregateFixture = await seedE2ePartPracticeTests(prisma);
    testFixture = await seedE2eToeicTest(prisma);
    await app.init();

    const auth = await registerE2eUser(app.getHttpServer(), {
      email,
      password,
      name: 'Part Practice E2E',
    });
    accessToken = auth.accessToken;
  });

  afterEach(async () => {
    await cleanupE2ePartPracticeData(prisma, email);
    await cleanupE2eToeicData(prisma, email);
    await app.close();
  });

  it('lists part summaries with catalog totals', async () => {
    const response = await request(app.getHttpServer())
      .get('/tests/part-practice/parts')
      .set(withBearerAuth(accessToken))
      .expect(200);

    const body = parseResponseBody<PartPracticeSummaryE2eBody>(response);
    const part1 = body.items.find((item) => item.partNumber === 1);

    expect(part1).toMatchObject({
      partNumber: 1,
      total: 3,
      answered: 0,
      correct: 0,
      wrong: 0,
    });
  });

  it('creates aggregate sessions across all tests and reuses the same run', async () => {
    const createResponse = await createPartPracticeRunRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({ partNumber: 1, mode: 'practice' })
      .expect(201);

    const createdSession =
      parseResponseBody<PartPracticeSessionE2eBody>(createResponse);
    expect(createdSession).toMatchObject({
      mode: 'practice',
      partNumber: 1,
      totalQuestions: 3,
      correctCount: 0,
      wrongCount: 0,
    });
    expect(createdSession.groups).toHaveLength(3);
    expect(createdSession.groups.map((group) => group.testId).sort()).toEqual(
      [
        aggregateFixture.testAId,
        aggregateFixture.testBId,
        testFixture.testId,
      ].sort(),
    );

    const reuseResponse = await createPartPracticeRunRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({ partNumber: 1, mode: 'practice' })
      .expect(201);

    const reusedSession =
      parseResponseBody<PartPracticeSessionE2eBody>(reuseResponse);
    expect(reusedSession.sessionId).toBe(createdSession.sessionId);
  });

  it('grades a group on submit and updates summary counts', async () => {
    const createResponse = await createPartPracticeRunRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({ partNumber: 1, mode: 'practice' })
      .expect(201);

    const session =
      parseResponseBody<PartPracticeSessionE2eBody>(createResponse);
    const targetGroup = session.groups.find(
      (group) => group.testId === aggregateFixture.testAId,
    );
    const questionId = targetGroup?.questions[0]?.id;

    expect(questionId).toBeDefined();

    const submitResponse = await submitPartPracticeAnswerRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
    )
      .send({
        toeicQuestionId: questionId,
        selectedKey: 'B',
      })
      .expect(201);

    expect(
      parseResponseBody<SubmitToeicAnswerE2eBody>(submitResponse),
    ).toMatchObject({
      graded: true,
      isCorrect: false,
      answerKey: 'A',
    });

    const summaryResponse = await request(app.getHttpServer())
      .get('/tests/part-practice/parts')
      .set(withBearerAuth(accessToken))
      .expect(200);

    const summary = parseResponseBody<PartPracticeSummaryE2eBody>(
      summaryResponse,
    ).items.find((item) => item.partNumber === 1);

    expect(summary).toMatchObject({
      total: 3,
      answered: 1,
      correct: 0,
      wrong: 1,
    });
  });

  it('returns review wrong with highlighted correct and masked wrong questions', async () => {
    const createResponse = await createPartPracticeRunRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({ partNumber: 1, mode: 'practice' })
      .expect(201);

    const session =
      parseResponseBody<PartPracticeSessionE2eBody>(createResponse);

    await submitPartPracticeAnswerRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
    )
      .send({
        toeicQuestionId: aggregateFixture.part1QuestionAId,
        selectedKey: 'A',
      })
      .expect(201);

    await submitPartPracticeAnswerRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
    )
      .send({
        toeicQuestionId: aggregateFixture.part1QuestionBId,
        selectedKey: 'A',
      })
      .expect(201);

    const reviewResponse = await getPartPracticeRunRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
      { mode: 'review_wrong' },
    ).expect(200);

    const reviewSession =
      parseResponseBody<PartPracticeSessionE2eBody>(reviewResponse);
    expect(reviewSession.mode).toBe('review_wrong');
    expect(reviewSession.groups).toHaveLength(1);
    expect(reviewSession.groups[0]).toMatchObject({
      testId: aggregateFixture.testBId,
      groupStatus: 'wrong',
      questions: [
        {
          id: aggregateFixture.part1QuestionBId,
          selectedKey: null,
          status: null,
          isCorrect: null,
        },
      ],
    });
  });

  it('keeps test list progress isolated from aggregate practice', async () => {
    const aggregateCreate = await createPartPracticeRunRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({ partNumber: 1, mode: 'practice' })
      .expect(201);

    const aggregateSession =
      parseResponseBody<PartPracticeSessionE2eBody>(aggregateCreate);

    await submitPartPracticeAnswerRequest(
      app.getHttpServer(),
      accessToken,
      aggregateSession.sessionId,
    )
      .send({
        toeicQuestionId: aggregateFixture.part1QuestionAId,
        selectedKey: 'B',
      })
      .expect(201);

    const testCreate = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: testFixture.testId,
        partNumbers: [1],
        mode: 'practice',
      })
      .expect(201);

    const testSession = parseResponseBody<ToeicSessionE2eBody>(testCreate);

    await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      testSession.sessionId,
    )
      .send({
        toeicQuestionId: testFixture.part1QuestionId,
        selectedKey: 'A',
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get(`/tests?year=${testFixture.year}`)
      .set(withBearerAuth(accessToken))
      .expect(200);

    const listBody = parseResponseBody<ToeicTestListE2eBody>(listResponse);
    const testItem = listBody.items.find(
      (item) => item.id === testFixture.testId,
    );
    const part1 = testItem?.parts.find((part) => part.partNumber === 1);

    expect(part1).toMatchObject({
      partCorrectCount: 1,
      partWrongCount: 0,
    });

    const aggregateYearList = await request(app.getHttpServer())
      .get(`/tests?year=${E2E_AGGREGATE_YEAR_B}`)
      .set(withBearerAuth(accessToken))
      .expect(200);

    const aggregateYearBody =
      parseResponseBody<ToeicTestListE2eBody>(aggregateYearList);
    const aggregateTestItem = aggregateYearBody.items.find(
      (item) => item.id === aggregateFixture.testBId,
    );
    const aggregatePart1 = aggregateTestItem?.parts.find(
      (part) => part.partNumber === 1,
    );

    expect(aggregatePart1).toMatchObject({
      partCorrectCount: 0,
      partWrongCount: 0,
    });
  });

  it('clears only aggregate history for the requested part', async () => {
    const createResponse = await createPartPracticeRunRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({ partNumber: 1, mode: 'practice' })
      .expect(201);

    const session =
      parseResponseBody<PartPracticeSessionE2eBody>(createResponse);

    await submitPartPracticeAnswerRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
    )
      .send({
        toeicQuestionId: aggregateFixture.part1QuestionAId,
        selectedKey: 'A',
      })
      .expect(201);

    const testCreate = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: testFixture.testId,
        partNumbers: [1],
        mode: 'practice',
      })
      .expect(201);

    const testSession = parseResponseBody<ToeicSessionE2eBody>(testCreate);

    await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      testSession.sessionId,
    )
      .send({
        toeicQuestionId: testFixture.part1QuestionId,
        selectedKey: 'A',
      })
      .expect(201);

    const clearResponse = await request(app.getHttpServer())
      .delete('/tests/part-practice/1/history')
      .set(withBearerAuth(accessToken))
      .expect(200);

    expect(parseResponseBody<{ resetRunCount: number }>(clearResponse)).toEqual(
      {
        resetRunCount: 1,
      },
    );

    const summaryResponse = await request(app.getHttpServer())
      .get('/tests/part-practice/parts')
      .set(withBearerAuth(accessToken))
      .expect(200);

    const part1Summary = parseResponseBody<PartPracticeSummaryE2eBody>(
      summaryResponse,
    ).items.find((item) => item.partNumber === 1);

    expect(part1Summary).toMatchObject({
      answered: 0,
      correct: 0,
      wrong: 0,
    });

    const listResponse = await request(app.getHttpServer())
      .get(`/tests?year=${testFixture.year}`)
      .set(withBearerAuth(accessToken))
      .expect(200);

    const testItem = parseResponseBody<ToeicTestListE2eBody>(
      listResponse,
    ).items.find((item) => item.id === testFixture.testId);
    const part1 = testItem?.parts.find((part) => part.partNumber === 1);

    expect(part1).toMatchObject({
      partCorrectCount: 1,
      partWrongCount: 0,
    });
  });
});
