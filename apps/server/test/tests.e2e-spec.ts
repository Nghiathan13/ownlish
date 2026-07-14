import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { registerE2eUser } from './helpers/e2e-auth';
import { getE2ePrisma } from './helpers/e2e-prisma';
import {
  cleanupE2eToeicData,
  createToeicRunsRequest,
  expandToeicRunPartsRequest,
  finishToeicRunRequest,
  getToeicRunRequest,
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
import { parseResponseBody } from './helpers/parse-response-body';

describe('TestsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let accessToken: string;
  let fixture: E2eToeicFixture;

  const email = 'tests-e2e@example.com';
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

    await cleanupE2eToeicData(prisma, email);
    fixture = await seedE2eToeicTest(prisma);
    await app.init();

    const auth = await registerE2eUser(app.getHttpServer(), {
      email,
      password,
      name: 'Tests E2E',
    });
    accessToken = auth.accessToken;
  });

  afterEach(async () => {
    await cleanupE2eToeicData(prisma, email);
    await app.close();
  });

  it('lists seeded TOEIC tests by year', async () => {
    const response = await request(app.getHttpServer())
      .get(`/tests?year=${fixture.year}`)
      .set(withBearerAuth(accessToken))
      .expect(200);

    const body = parseResponseBody<ToeicTestListE2eBody>(response);
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: fixture.testId,
          year: fixture.year,
        }),
      ]),
    );
  });

  it('runs practice sessions, grades answers, and reuses the latest run', async () => {
    const createResponse = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: fixture.testId,
        partNumbers: [1],
        mode: 'practice',
      })
      .expect(201);

    const createdSession =
      parseResponseBody<ToeicSessionE2eBody>(createResponse);
    expect(createdSession).toMatchObject({
      mode: 'practice',
      testId: fixture.testId,
      year: fixture.year,
      partNumbers: [1],
      totalQuestions: 1,
      completedAt: null,
    });

    const getResponse = await getToeicRunRequest(
      app.getHttpServer(),
      accessToken,
      createdSession.sessionId,
      { parts: '1' },
    ).expect(200);

    const loadedSession = parseResponseBody<ToeicSessionE2eBody>(getResponse);
    expect(loadedSession.sessionId).toBe(createdSession.sessionId);
    expect(loadedSession.groups).toHaveLength(1);
    expect(loadedSession.groups[0]?.questions[0]?.id).toBe(
      fixture.part1QuestionId,
    );

    const answerResponse = await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      createdSession.sessionId,
    )
      .send({
        toeicQuestionId: fixture.part1QuestionId,
        selectedKey: 'B',
        mode: 'practice',
      })
      .expect(201);

    const gradedAnswer =
      parseResponseBody<SubmitToeicAnswerE2eBody>(answerResponse);
    expect(gradedAnswer).toMatchObject({
      graded: true,
      isCorrect: false,
      answerKey: 'A',
      correctOptionEn: 'Option A',
    });

    const retryResponse = await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      createdSession.sessionId,
    )
      .send({
        toeicQuestionId: fixture.part1QuestionId,
        selectedKey: 'B',
        mode: 'practice',
      })
      .expect(201);

    expect(
      parseResponseBody<SubmitToeicAnswerE2eBody>(retryResponse),
    ).toMatchObject({
      graded: true,
      isCorrect: false,
      answerKey: 'A',
    });

    await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      createdSession.sessionId,
    )
      .send({
        toeicQuestionId: fixture.part1QuestionId,
        selectedKey: 'A',
        mode: 'practice',
      })
      .expect(400);

    const resumeResponse = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: fixture.testId,
        partNumbers: [1],
        mode: 'practice',
      })
      .expect(201);

    const resumedSession =
      parseResponseBody<ToeicSessionE2eBody>(resumeResponse);
    expect(resumedSession.sessionId).toBe(createdSession.sessionId);
    expect(resumedSession.wrongCount).toBe(1);
  });

  it('expands a practice session through expand-parts before getRun', async () => {
    const createResponse = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: fixture.testId,
        partNumbers: [1],
        mode: 'practice',
      })
      .expect(201);

    const session = parseResponseBody<ToeicSessionE2eBody>(createResponse);

    await expandToeicRunPartsRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
      [1, 2],
    ).expect(201);

    const expandedResponse = await getToeicRunRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
      { parts: '1,2' },
    ).expect(200);

    const expandedSession =
      parseResponseBody<ToeicSessionE2eBody>(expandedResponse);
    expect(expandedSession.partNumbers).toEqual([1, 2]);
    expect(expandedSession.totalQuestions).toBe(2);
    expect(expandedSession.groups.map((group) => group.partNumber)).toEqual([
      1, 2,
    ]);
  });

  it('returns a review wrong view after a graded mistake', async () => {
    const createResponse = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: fixture.testId,
        partNumbers: [1],
        mode: 'practice',
      })
      .expect(201);

    const session = parseResponseBody<ToeicSessionE2eBody>(createResponse);

    await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
    )
      .send({
        toeicQuestionId: fixture.part1QuestionId,
        selectedKey: 'B',
        mode: 'practice',
      })
      .expect(201);

    const reviewWrongResponse = await getToeicRunRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
      { parts: '1', mode: 'review_wrong' },
    ).expect(200);

    const reviewWrongSession =
      parseResponseBody<ToeicSessionE2eBody>(reviewWrongResponse);
    expect(reviewWrongSession).toMatchObject({
      sessionId: session.sessionId,
      mode: 'review_wrong',
      totalQuestions: 1,
      wrongCount: 1,
    });
    expect(reviewWrongSession.groups[0]?.questions[0]).toMatchObject({
      id: fixture.part1QuestionId,
      selectedKey: null,
      status: null,
      isCorrect: null,
    });
  });

  it('runs mock tests without grading until finish', async () => {
    const createResponse = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: fixture.testId,
        partNumbers: [1],
        mode: 'mock_test',
      })
      .expect(201);

    const session = parseResponseBody<ToeicSessionE2eBody>(createResponse);
    expect(session.mode).toBe('mock_test');
    expect(session.completedAt).toBeNull();

    const answerResponse = await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
    )
      .send({
        toeicQuestionId: fixture.part1QuestionId,
        selectedKey: 'B',
      })
      .expect(201);

    expect(parseResponseBody<SubmitToeicAnswerE2eBody>(answerResponse)).toEqual(
      {
        graded: false,
      },
    );

    const [finishResponse, concurrentFinishResponse] = await Promise.all([
      finishToeicRunRequest(
        app.getHttpServer(),
        accessToken,
        session.sessionId,
      ).expect(200),
      finishToeicRunRequest(
        app.getHttpServer(),
        accessToken,
        session.sessionId,
      ).expect(200),
    ]);

    const finishedSession =
      parseResponseBody<ToeicSessionE2eBody>(finishResponse);
    const concurrentFinishedSession = parseResponseBody<ToeicSessionE2eBody>(
      concurrentFinishResponse,
    );
    expect(finishedSession).toMatchObject({
      sessionId: session.sessionId,
      mode: 'mock_test',
      wrongCount: 1,
      correctCount: 0,
    });
    expect(finishedSession.completedAt).toEqual(expect.any(String));
    expect(concurrentFinishedSession).toMatchObject({
      sessionId: session.sessionId,
      mode: 'mock_test',
      wrongCount: 1,
      correctCount: 0,
      completedAt: finishedSession.completedAt,
    });

    await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
    )
      .send({
        toeicQuestionId: fixture.part1QuestionId,
        selectedKey: 'A',
      })
      .expect(400);
  });

  it('rejects review wrong mode for mock sessions', async () => {
    const createResponse = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: fixture.testId,
        partNumbers: [1],
        mode: 'mock_test',
      })
      .expect(201);

    const session = parseResponseBody<ToeicSessionE2eBody>(createResponse);

    await getToeicRunRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
      { parts: '1', mode: 'review_wrong' },
    ).expect(400);
  });

  it('clears practice answer history for a test', async () => {
    const createResponse = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: fixture.testId,
        partNumbers: [1],
        mode: 'practice',
      })
      .expect(201);

    const session = parseResponseBody<ToeicSessionE2eBody>(createResponse);

    await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
    )
      .send({
        toeicQuestionId: fixture.part1QuestionId,
        selectedKey: 'B',
        mode: 'practice',
      })
      .expect(201);

    const clearResponse = await request(app.getHttpServer())
      .delete(`/tests/${fixture.testId}/practice-history`)
      .set(withBearerAuth(accessToken))
      .expect(200);

    expect(
      parseResponseBody<{ deletedSessionCount: number }>(clearResponse),
    ).toEqual({
      deletedSessionCount: 1,
    });

    const clearedSessionResponse = await getToeicRunRequest(
      app.getHttpServer(),
      accessToken,
      session.sessionId,
      { parts: '1' },
    ).expect(200);

    const clearedSession = parseResponseBody<ToeicSessionE2eBody>(
      clearedSessionResponse,
    );
    expect(clearedSession).toMatchObject({
      sessionId: session.sessionId,
      correctCount: 0,
      wrongCount: 0,
      groups: [
        expect.objectContaining({
          questions: [
            expect.objectContaining({
              selectedKey: null,
              status: null,
              isCorrect: null,
            }),
          ],
        }),
      ],
    });
  });

  it('clears practice answer history without deleting mock test runs', async () => {
    const practiceResponse = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: fixture.testId,
        partNumbers: [1],
        mode: 'practice',
      })
      .expect(201);

    const practiceSession =
      parseResponseBody<ToeicSessionE2eBody>(practiceResponse);

    await submitToeicAnswerRequest(
      app.getHttpServer(),
      accessToken,
      practiceSession.sessionId,
    )
      .send({
        toeicQuestionId: fixture.part1QuestionId,
        selectedKey: 'B',
        mode: 'practice',
      })
      .expect(201);

    const mockResponse = await createToeicRunsRequest(
      app.getHttpServer(),
      accessToken,
    )
      .send({
        testId: fixture.testId,
        partNumbers: [1],
        mode: 'mock_test',
      })
      .expect(201);

    const mockSession = parseResponseBody<ToeicSessionE2eBody>(mockResponse);

    const clearResponse = await request(app.getHttpServer())
      .delete(`/tests/${fixture.testId}/practice-history`)
      .set(withBearerAuth(accessToken))
      .expect(200);

    expect(
      parseResponseBody<{ deletedSessionCount: number }>(clearResponse),
    ).toEqual({
      deletedSessionCount: 1,
    });

    const clearedPracticeResponse = await getToeicRunRequest(
      app.getHttpServer(),
      accessToken,
      practiceSession.sessionId,
      { parts: '1' },
    ).expect(200);

    expect(
      parseResponseBody<ToeicSessionE2eBody>(clearedPracticeResponse),
    ).toMatchObject({
      sessionId: practiceSession.sessionId,
      correctCount: 0,
      wrongCount: 0,
    });

    await getToeicRunRequest(
      app.getHttpServer(),
      accessToken,
      mockSession.sessionId,
      { parts: '1' },
    ).expect(200);
  });
});
