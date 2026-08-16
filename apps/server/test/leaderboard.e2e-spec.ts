import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { registerE2eUser } from './helpers/e2e-auth';
import { getE2ePrisma } from './helpers/e2e-prisma';
import { parseResponseBody } from './helpers/parse-response-body';

type LeaderboardBody = {
  period: 'all' | 'week' | 'month';
  startsOn: string | null;
  endsOn: string | null;
  entries: Array<{
    rank: number;
    displayName: string;
    avatarUrl: string | null;
    studySeconds: number;
  }>;
};

const emails = [
  'leaderboard-alpha@example.com',
  'leaderboard-beta@example.com',
  'leaderboard-gamma@example.com',
  'leaderboard-idle@example.com',
];

describe('LeaderboardController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let accessToken: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    prisma = getE2ePrisma(app);
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.init();

    const [alpha, beta, gamma] = await Promise.all([
      registerE2eUser(app.getHttpServer(), {
        email: emails[0],
        password: 'test123456',
        name: 'Alpha',
      }),
      registerE2eUser(app.getHttpServer(), {
        email: emails[1],
        password: 'test123456',
        name: 'Beta',
      }),
      registerE2eUser(app.getHttpServer(), {
        email: emails[2],
        password: 'test123456',
        name: 'Gamma',
      }),
    ]);
    await registerE2eUser(app.getHttpServer(), {
      email: emails[3],
      password: 'test123456',
      name: 'Idle',
    });
    accessToken = alpha.accessToken;

    await prisma.userLearningDaily.createMany({
      data: [
        {
          userId: alpha.userId,
          learnedOn: new Date('2026-08-10T00:00:00.000Z'),
          activityType: 'TEST_PRACTICE',
          seconds: 100_000_000,
        },
        {
          userId: alpha.userId,
          learnedOn: new Date('2026-07-31T00:00:00.000Z'),
          activityType: 'DICTATION',
          seconds: 50_000_000,
        },
        {
          userId: beta.userId,
          learnedOn: new Date('2026-08-12T00:00:00.000Z'),
          activityType: 'DICTATION',
          seconds: 50_000_000,
        },
        {
          userId: gamma.userId,
          learnedOn: new Date('2026-08-16T00:00:00.000Z'),
          activityType: 'VOCABULARY_REVIEW',
          seconds: 50_000_000,
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  it('returns a top-100 public study-time leaderboard for the selected ISO week', async () => {
    const response = await request(app.getHttpServer())
      .get('/leaderboard/study-time?period=week&anchor=2026-08-10')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = parseResponseBody<LeaderboardBody>(response);

    expect(body).toMatchObject({
      period: 'week',
      startsOn: '2026-08-10',
      endsOn: '2026-08-16',
    });
    expect(body.entries.length).toBeGreaterThanOrEqual(3);
    expect(body.entries[0]).toEqual({
      rank: 1,
      displayName: 'Alpha',
      avatarUrl: null,
      studySeconds: 100_000_000,
    });
    expect(
      body.entries.filter((entry) => entry.studySeconds === 50_000_000),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ displayName: 'Beta', rank: 2 }),
        expect.objectContaining({ displayName: 'Gamma', rank: 2 }),
      ]),
    );
    expect(body.entries).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ displayName: 'Idle' }),
      ]),
    );
    expect(JSON.stringify(body)).not.toContain('leaderboard-alpha@example.com');
    expect(Object.keys(body.entries[0])).toEqual([
      'rank',
      'displayName',
      'avatarUrl',
      'studySeconds',
    ]);
  });

  it('uses all historical confirmed activity for all time and requires authentication', async () => {
    await request(app.getHttpServer())
      .get('/leaderboard/study-time?period=all')
      .expect(401);

    const response = await request(app.getHttpServer())
      .get('/leaderboard/study-time?period=all')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = parseResponseBody<LeaderboardBody>(response);

    expect(body).toMatchObject({ period: 'all', startsOn: null, endsOn: null });
    expect(body.entries[0]).toMatchObject({
      displayName: 'Alpha',
      studySeconds: 150_000_000,
    });
  });
});
