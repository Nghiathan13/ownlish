import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

function getRefreshCookie(response: request.Response): string | undefined {
  const setCookie = response.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

  return cookies.find((cookie) => cookie?.startsWith('engvocab.refreshToken='));
}

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const email = 'auth-e2e@example.com';
  const password = 'test123456';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);

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

    expect(registerResponse.body.accessToken).toEqual(expect.any(String));
    expect(registerResponse.body).not.toHaveProperty('refreshToken');
    expect(getRefreshCookie(registerResponse)).toEqual(expect.any(String));
    expect(registerResponse.body.user).toMatchObject({
      email,
      name: 'Auth E2E',
    });
    expect(registerResponse.body.user).not.toHaveProperty('passwordHash');

    const loginResponse = await agent
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body).not.toHaveProperty('refreshToken');
    expect(getRefreshCookie(loginResponse)).toEqual(expect.any(String));
    expect(loginResponse.body.user).not.toHaveProperty('passwordHash');

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          email,
          name: 'Auth E2E',
        });
        expect(response.body).not.toHaveProperty('passwordHash');
      });

    const refreshResponse = await agent
      .post('/auth/refresh')
      .expect(201);

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body).not.toHaveProperty('refreshToken');
    expect(getRefreshCookie(refreshResponse)).toEqual(expect.any(String));

    await agent
      .post('/auth/logout')
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual({ success: true });
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
        expect(response.body.accessToken).toEqual(expect.any(String));
        expect(response.body).not.toHaveProperty('refreshToken');
        expect(getRefreshCookie(response)).toEqual(expect.any(String));
      });
  });

  it('rejects invalid current user token', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
