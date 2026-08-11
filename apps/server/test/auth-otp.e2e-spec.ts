import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { OutboxLoginCodeMailer } from '../src/auth/outbox-login-code-mailer';
import { getRefreshCookie, type ClientAuthBody } from './helpers/e2e-auth';
import { getE2ePrisma } from './helpers/e2e-prisma';
import { parseResponseBody } from './helpers/parse-response-body';

describe('Auth email OTP (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let outbox: OutboxLoginCodeMailer;

  const email = 'auth-otp-e2e@example.com';
  const name = 'OTP E2E';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = getE2ePrisma(app);
    outbox = app.get(OutboxLoginCodeMailer);

    await prisma.user.deleteMany({ where: { email } });
    await prisma.emailOtpChallenge.deleteMany({ where: { email } });
    outbox.clear();

    await app.init();
  });

  afterEach(async () => {
    await prisma.emailOtpChallenge.deleteMany({ where: { email } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('requests a code from the outbox mailer and completes enrollment', async () => {
    const agent = request.agent(app.getHttpServer());

    const requestResponse = await agent
      .post('/auth/email-otp/request')
      .send({ email })
      .expect(201);

    const requestBody = parseResponseBody<{
      challengeId: string;
      resendAvailableAt: string;
    }>(requestResponse);
    expect(typeof requestBody.challengeId).toBe('string');
    expect(typeof requestBody.resendAvailableAt).toBe('string');

    const outboxResponse = await request(app.getHttpServer())
      .get('/auth/test/email-outbox/latest')
      .query({ email })
      .expect(200);

    const outboxBody = parseResponseBody<{
      code: string;
      email: string;
      idempotencyKey: string;
    }>(outboxResponse);
    expect(outboxBody.email).toBe(email);
    expect(outboxBody.code).toMatch(/^\d{6}$/);
    expect(outboxBody.idempotencyKey).toBe(
      `email-otp:${requestBody.challengeId}`,
    );

    const verifyResponse = await agent
      .post('/auth/email-otp/verify')
      .send({
        challengeId: requestBody.challengeId,
        code: outboxBody.code,
      })
      .expect(201);

    const verifyBody = parseResponseBody<{
      enrollmentToken: string;
      status: 'profile_required';
    }>(verifyResponse);
    expect(verifyBody.status).toBe('profile_required');
    expect(typeof verifyBody.enrollmentToken).toBe('string');
    expect(getRefreshCookie(verifyResponse)).toBeUndefined();

    const completeResponse = await agent
      .post('/auth/email-otp/complete-profile')
      .send({
        enrollmentToken: verifyBody.enrollmentToken,
        name,
      })
      .expect(201);

    const completeBody = parseResponseBody<ClientAuthBody>(completeResponse);
    expect(typeof completeBody.accessToken).toBe('string');
    expect(completeBody.user).toMatchObject({
      email,
      name,
      role: 'USER',
    });
    expect(getRefreshCookie(completeResponse)).toEqual(
      expect.stringContaining('ownlish.refreshToken='),
    );

    await agent.post('/auth/refresh').expect(201);
    await agent.post('/auth/logout').expect(201);
    await agent.post('/auth/refresh').expect(401);
  });

  it('authenticates an existing user without a profile step', async () => {
    await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    const agent = request.agent(app.getHttpServer());
    const requestResponse = await agent
      .post('/auth/email-otp/request')
      .send({ email })
      .expect(201);
    const { challengeId } = parseResponseBody<{ challengeId: string }>(
      requestResponse,
    );

    const { code } = parseResponseBody<{ code: string }>(
      await request(app.getHttpServer())
        .get('/auth/test/email-outbox/latest')
        .query({ email })
        .expect(200),
    );

    const verifyResponse = await agent
      .post('/auth/email-otp/verify')
      .send({ challengeId, code })
      .expect(201);

    const verifyBody = parseResponseBody<ClientAuthBody>(verifyResponse);
    expect(typeof verifyBody.accessToken).toBe('string');
    expect(verifyBody.user).toMatchObject({ email, name });
    expect(verifyBody).not.toHaveProperty('status');
    expect(getRefreshCookie(verifyResponse)).toEqual(
      expect.stringContaining('ownlish.refreshToken='),
    );
  });

  it('invalidates the previous code when requesting a replacement', async () => {
    const agent = request.agent(app.getHttpServer());
    const firstRequest = await agent
      .post('/auth/email-otp/request')
      .send({ email })
      .expect(201);
    const firstChallenge = parseResponseBody<{ challengeId: string }>(
      firstRequest,
    );
    const { code: firstCode } = parseResponseBody<{ code: string }>(
      await request(app.getHttpServer())
        .get('/auth/test/email-outbox/latest')
        .query({ email })
        .expect(200),
    );

    await prisma.emailOtpChallenge.update({
      where: { id: firstChallenge.challengeId },
      data: { lastSentAt: new Date(Date.now() - 60_001) },
    });

    const secondRequest = await agent
      .post('/auth/email-otp/request')
      .send({ email })
      .expect(201);
    const secondChallenge = parseResponseBody<{ challengeId: string }>(
      secondRequest,
    );
    const { code: secondCode } = parseResponseBody<{ code: string }>(
      await request(app.getHttpServer())
        .get('/auth/test/email-outbox/latest')
        .query({ email })
        .expect(200),
    );

    expect(secondChallenge.challengeId).not.toBe(firstChallenge.challengeId);
    await agent
      .post('/auth/email-otp/verify')
      .send({ challengeId: firstChallenge.challengeId, code: firstCode })
      .expect(401);
    await agent
      .post('/auth/email-otp/verify')
      .send({ challengeId: secondChallenge.challengeId, code: secondCode })
      .expect(201);
  });

  it('rejects an incorrect verification code', async () => {
    const requestResponse = await request(app.getHttpServer())
      .post('/auth/email-otp/request')
      .send({ email })
      .expect(201);
    const { challengeId } = parseResponseBody<{ challengeId: string }>(
      requestResponse,
    );

    await request(app.getHttpServer())
      .post('/auth/email-otp/verify')
      .send({ challengeId, code: '000000' })
      .expect(401);
  });
});
