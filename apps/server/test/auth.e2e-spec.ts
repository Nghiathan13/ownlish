import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import type { PublicUser } from '../src/auth/types/auth.types';
import { getRefreshCookie, type ClientAuthBody } from './helpers/e2e-auth';
import { getE2ePrisma } from './helpers/e2e-prisma';
import { parseResponseBody } from './helpers/parse-response-body';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const email = 'auth-e2e@example.com';
  const password = 'test123456';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = getE2ePrisma(app);

    await prisma.user.deleteMany({
      where: { email },
    });

    await app.init();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email },
    });
    await app.close();
  });

  it('registers, logs in, and returns the current user', async () => {
    const agent = request.agent(app.getHttpServer());
    const registerResponse = await agent
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Auth E2E',
      })
      .expect(201);

    const registerBody = parseResponseBody<ClientAuthBody>(registerResponse);
    expect(typeof registerBody.accessToken).toBe('string');
    expect(registerBody).not.toHaveProperty('refreshToken');
    expect(getRefreshCookie(registerResponse)).toEqual(
      expect.stringContaining('engvocab.refreshToken='),
    );
    expect(registerBody.user).toMatchObject({
      email,
      name: 'Auth E2E',
    });
    expect(registerBody.user).not.toHaveProperty('passwordHash');

    const loginResponse = await agent
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    const loginBody = parseResponseBody<ClientAuthBody>(loginResponse);
    expect(typeof loginBody.accessToken).toBe('string');
    expect(loginBody).not.toHaveProperty('refreshToken');
    expect(getRefreshCookie(loginResponse)).toEqual(
      expect.stringContaining('engvocab.refreshToken='),
    );
    expect(loginBody.user).not.toHaveProperty('passwordHash');

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200)
      .expect((response) => {
        const meBody = parseResponseBody<PublicUser>(response);
        expect(meBody).toMatchObject({
          email,
          name: 'Auth E2E',
        });
        expect(meBody).not.toHaveProperty('passwordHash');
      });

    const refreshResponse = await agent.post('/auth/refresh').expect(201);

    const refreshBody = parseResponseBody<ClientAuthBody>(refreshResponse);
    expect(typeof refreshBody.accessToken).toBe('string');
    expect(refreshBody).not.toHaveProperty('refreshToken');
    expect(getRefreshCookie(refreshResponse)).toEqual(
      expect.stringContaining('engvocab.refreshToken='),
    );

    await agent
      .post('/auth/logout')
      .expect(201)
      .expect((response) => {
        expect(parseResponseBody<{ success: boolean }>(response)).toEqual({
          success: true,
        });
      });

    await agent.post('/auth/refresh').expect(401);
  });

  it('keeps refresh sessions independent across devices', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Auth E2E',
      })
      .expect(201);

    const firstAgent = request.agent(app.getHttpServer());
    const secondAgent = request.agent(app.getHttpServer());

    const firstLoginResponse = await firstAgent
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    const secondLoginResponse = await secondAgent
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    expect(getRefreshCookie(firstLoginResponse)).not.toBe(
      getRefreshCookie(secondLoginResponse),
    );

    await firstAgent.post('/auth/logout').expect(201);

    await firstAgent.post('/auth/refresh').expect(401);

    await secondAgent
      .post('/auth/refresh')
      .expect(201)
      .expect((response) => {
        const refreshBody = parseResponseBody<ClientAuthBody>(response);
        expect(typeof refreshBody.accessToken).toBe('string');
        expect(refreshBody).not.toHaveProperty('refreshToken');
        expect(getRefreshCookie(response)).toEqual(
          expect.stringContaining('engvocab.refreshToken='),
        );
      });
  });

  it('rejects invalid current user token', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
