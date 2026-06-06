import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('VocabController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

  const email = 'vocab-e2e@example.com';
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

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Vocab E2E',
      })
      .expect(201);

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email },
    });
    await app.close();
  });

  it('creates, lists, updates, and soft deletes a vocabulary word', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: ' Hello ',
        meaningVi: 'xin chao',
        level: 1,
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      userId,
      word: 'Hello',
      normalizedWord: 'hello',
      meaningVi: 'xin chao',
      level: 1,
      deletedAt: null,
    });

    const wordId = createResponse.body.id;

    await request(app.getHttpServer())
      .get('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
          id: wordId,
          word: 'Hello',
          normalizedWord: 'hello',
        });
      });

    await request(app.getHttpServer())
      .patch(`/vocab/${wordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'Updated',
        wrongCount: 2,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: wordId,
          word: 'Updated',
          normalizedWord: 'updated',
          wrongCount: 2,
        });
      });

    await request(app.getHttpServer())
      .delete(`/vocab/${wordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.id).toBe(wordId);
        expect(response.body.deletedAt).toEqual(expect.any(String));
      });

    await request(app.getHttpServer())
      .get('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect([]);
  });

  it('requires authentication', () => {
    return request(app.getHttpServer()).get('/vocab').expect(401);
  });

  it('rejects duplicate active words for the same user', async () => {
    const payload = {
      word: 'hello',
    };

    await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(409);
  });
});
