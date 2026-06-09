import { INestApplication, ValidationPipe } from '@nestjs/common';
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
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
      .get(`/vocab/${wordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: wordId,
          word: 'Hello',
          normalizedWord: 'hello',
        });
      });

    await request(app.getHttpServer())
      .get('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0]).toMatchObject({
          id: wordId,
          word: 'Hello',
          normalizedWord: 'hello',
        });
        expect(response.body.meta).toMatchObject({
          limit: 50,
          offset: 0,
          total: 1,
          hasMore: false,
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
      .patch(`/vocab/${wordId}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 3,
        wrongCount: 1,
        lastReview: '2026-06-07T00:00:00.000Z',
        nextReview: '2026-06-08T00:00:00.000Z',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: wordId,
          level: 3,
          wrongCount: 1,
          lastReview: '2026-06-07T00:00:00.000Z',
          nextReview: '2026-06-08T00:00:00.000Z',
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
      .expect((response) => {
        expect(response.body.items).toEqual([]);
        expect(response.body.meta).toMatchObject({
          total: 0,
          hasMore: false,
        });
      });
  });

  it('requires authentication', () => {
    return request(app.getHttpServer()).get('/vocab').expect(401);
  });

  it('searches vocabulary words', async () => {
    const helloResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'hello',
        meaningVi: 'xin chao',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'shell',
        meaningVi: 'vo',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/vocab?search=he')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toHaveLength(2);
        const words = response.body.items.map((item: { word: string }) => item.word);
        expect(words).toContain('hello');
        expect(words).toContain('shell');
        expect(response.body.meta).toMatchObject({
          total: 2,
          hasMore: false,
        });
      });
  });

  it('returns vocabulary stats', async () => {
    await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'new word',
      })
      .expect(201);

    const masteredResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'mastered word',
        level: 7,
      })
      .expect(201);

    const difficultResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'difficult word',
        wrongCount: 3,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/vocab/${masteredResponse.body.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 7,
        wrongCount: 0,
        lastReview: '2999-01-01T00:00:00.000Z',
        nextReview: null,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.nextReview).toBeNull();
      });

    await request(app.getHttpServer())
      .patch(`/vocab/${difficultResponse.body.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 1,
        wrongCount: 3,
        lastReview: '2999-01-01T00:00:00.000Z',
        nextReview: '2999-01-02T00:00:00.000Z',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/vocab/stats')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          total: 3,
          due: 1,
          mastered: 1,
          highWrongCount: 1,
        });
        expect(response.body.levels).toHaveLength(8);
        expect(response.body.levels).toContainEqual({
          level: 0,
          count: 1,
        });
        expect(response.body.levels).toContainEqual({
          level: 1,
          count: 1,
        });
        expect(response.body.levels).toContainEqual({
          level: 7,
          count: 1,
        });
      });
  });

  it('lists due review words only', async () => {
    const newWordResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'new word',
      })
      .expect(201);

    const dueWordResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'due word',
      })
      .expect(201);

    const futureWordResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'future word',
      })
      .expect(201);

    const masteredWordResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'mastered word',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/vocab/${dueWordResponse.body.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 1,
        wrongCount: 0,
        lastReview: '2000-01-01T00:00:00.000Z',
        nextReview: '2000-01-02T00:00:00.000Z',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/vocab/${futureWordResponse.body.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 1,
        wrongCount: 0,
        lastReview: '2999-01-01T00:00:00.000Z',
        nextReview: '2999-01-02T00:00:00.000Z',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/vocab/${masteredWordResponse.body.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 7,
        wrongCount: 0,
        lastReview: '2000-01-01T00:00:00.000Z',
        nextReview: null,
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/vocab/review/due?limit=10&offset=0')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const ids = response.body.items.map((word: { id: string }) => word.id);

        expect(ids).toContain(newWordResponse.body.id);
        expect(ids).toContain(dueWordResponse.body.id);
        expect(ids).not.toContain(futureWordResponse.body.id);
        expect(ids).not.toContain(masteredWordResponse.body.id);
        expect(response.body.meta).toMatchObject({
          limit: 10,
          offset: 0,
          total: 2,
          hasMore: false,
        });
      });
  });

  it('returns not found when updating review for a missing word', () => {
    return request(app.getHttpServer())
      .patch('/vocab/missing-id/review')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 3,
        wrongCount: 1,
        lastReview: '2026-06-07T00:00:00.000Z',
        nextReview: '2026-06-08T00:00:00.000Z',
      })
      .expect(404);
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

  it('allows creating the same word after soft delete', async () => {
    const payload = {
      word: 'hello',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/vocab/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const reAddResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    expect(reAddResponse.body.id).not.toBe(createResponse.body.id);
    expect(reAddResponse.body).toMatchObject({
      word: 'hello',
      normalizedWord: 'hello',
      deletedAt: null,
    });

    await request(app.getHttpServer())
      .get('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].id).toBe(reAddResponse.body.id);
        expect(response.body.meta).toMatchObject({
          total: 1,
          hasMore: false,
        });
      });
  });
});
