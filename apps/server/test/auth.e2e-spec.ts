import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

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
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Auth E2E',
      })
      .expect(201);

    expect(registerResponse.body.accessToken).toEqual(expect.any(String));
    expect(registerResponse.body.refreshToken).toEqual(expect.any(String));
    expect(registerResponse.body.user).toMatchObject({
      email,
      name: 'Auth E2E',
    });
    expect(registerResponse.body.user).not.toHaveProperty('passwordHash');

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.refreshToken).toEqual(expect.any(String));
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

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: loginResponse.body.refreshToken,
      })
      .expect(201);

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken,
    );

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken: refreshResponse.body.refreshToken,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual({ success: true });
      });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: refreshResponse.body.refreshToken,
      })
      .expect(401);
  });

  it('rejects invalid current user token', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
