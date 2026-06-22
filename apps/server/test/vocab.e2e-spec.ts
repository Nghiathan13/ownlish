import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { registerE2eUser } from './helpers/e2e-auth';
import {
  buildVocabListPath,
  buildVocabStatsPath,
  getDefaultCollectionId,
  withDefaultCollection,
} from './helpers/e2e-collections';
import { getE2ePrisma } from './helpers/e2e-prisma';
import { parseResponseBody } from './helpers/parse-response-body';
import type {
  DeleteDefinitionBody,
  DueReviewListBody,
  ReviewDefinitionBody,
  VocabListBody,
  VocabStatsBody,
  VocabWordBody,
} from './helpers/e2e-vocab-types';

describe('VocabController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let accessToken: string;
  let userId: string;
  let defaultCollectionId: string;

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
    prisma = getE2ePrisma(app);

    await prisma.user.deleteMany({
      where: { email },
    });

    await app.init();

    const auth = await registerE2eUser(app.getHttpServer(), {
      email,
      password,
      name: 'Vocab E2E',
    });
    accessToken = auth.accessToken;
    userId = auth.userId;
    defaultCollectionId = await getDefaultCollectionId(
      app.getHttpServer(),
      accessToken,
    );
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
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: ' Hello ',
          meaningVi: 'xin chao',
          level: 1,
        }),
      )
      .expect(201);

    const createBody = parseResponseBody<VocabWordBody>(createResponse);

    expect(createBody).toMatchObject({
      userId,
      word: 'Hello',
      normalizedWord: 'hello',
      definitions: [
        expect.objectContaining({
          meaningVi: 'xin chao',
          level: 1,
          deletedAt: null,
        }),
      ],
    });

    const wordId = createBody.id;

    await request(app.getHttpServer())
      .get(`/vocab/${wordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(parseResponseBody<VocabWordBody>(response)).toMatchObject({
          id: wordId,
          word: 'Hello',
          normalizedWord: 'hello',
        });
      });

    await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const listBody = parseResponseBody<VocabListBody>(response);
        expect(listBody.items).toHaveLength(1);
        expect(listBody.items[0]).toMatchObject({
          id: wordId,
          word: 'Hello',
          normalizedWord: 'hello',
        });
        expect(listBody.meta).toMatchObject({
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
        definitionId: createBody.definitions[0].id,
        wrongCount: 2,
      })
      .expect(200)
      .expect((response) => {
        expect(parseResponseBody<VocabWordBody>(response)).toMatchObject({
          id: wordId,
          word: 'Updated',
          normalizedWord: 'updated',
          definitions: [
            expect.objectContaining({
              wrongCount: 2,
            }),
          ],
        });
      });

    const updatedDefinitionId = parseResponseBody<VocabWordBody>(
      await request(app.getHttpServer())
        .get(`/vocab/${wordId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200),
    ).definitions[0].id;

    await request(app.getHttpServer())
      .patch(`/vocab/${updatedDefinitionId}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 3,
        wrongCount: 1,
        lastReview: '2026-06-07T00:00:00.000Z',
        nextReview: '2026-06-08T00:00:00.000Z',
      })
      .expect(200)
      .expect((response) => {
        expect(parseResponseBody<ReviewDefinitionBody>(response)).toMatchObject(
          {
            id: updatedDefinitionId,
            level: 3,
            wrongCount: 1,
            lastReview: '2026-06-07T00:00:00.000Z',
            nextReview: '2026-06-08T00:00:00.000Z',
          },
        );
      });

    await request(app.getHttpServer())
      .delete(`/vocab/${wordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const deletedWord = parseResponseBody<VocabWordBody>(response);
        expect(deletedWord.id).toBe(wordId);
        expect(deletedWord.definitions).toEqual([]);
      });

    await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const listBody = parseResponseBody<VocabListBody>(response);
        expect(listBody.items).toEqual([]);
        expect(listBody.meta).toMatchObject({
          total: 0,
          hasMore: false,
        });
      });
  });

  it('requires authentication', () => {
    return request(app.getHttpServer()).get('/vocab').expect(401);
  });

  it('soft deletes a single definition and reports wordRemoved', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'delete me',
          meaningVi: 'xoa',
        }),
      )
      .expect(201);

    const createBody = parseResponseBody<VocabWordBody>(createResponse);
    const wordId = createBody.id;
    const definitionId = createBody.definitions[0].id;

    await request(app.getHttpServer())
      .delete(`/vocab/definitions/${definitionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const deleteBody = parseResponseBody<DeleteDefinitionBody>(response);
        expect(deleteBody).toEqual({
          deletedDefinitionId: definitionId,
          vocabWordId: wordId,
          wordRemoved: true,
        });
        expect(deleteBody.word).toBeUndefined();
      });

    await request(app.getHttpServer())
      .get(`/vocab/${wordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const listBody = parseResponseBody<VocabListBody>(response);
        expect(listBody.items).toEqual([]);
        expect(listBody.meta.total).toBe(0);
      });
  });

  it('returns not found when deleting with a word id instead of a definition id', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'strict delete',
          meaningVi: 'xoa',
        }),
      )
      .expect(201);

    const wordId = parseResponseBody<VocabWordBody>(createResponse).id;

    await request(app.getHttpServer())
      .delete(`/vocab/definitions/${wordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/vocab/${wordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('soft deletes one definition when other definitions remain', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'bank',
          type: 'noun',
          meaningVi: 'ngan hang',
        }),
      )
      .expect(201);

    const createBody = parseResponseBody<VocabWordBody>(createResponse);
    const wordId = createBody.id;
    const firstDefinitionId = createBody.definitions[0].id;

    const secondDefinition = await prisma.vocabWordDefinition.create({
      data: {
        vocabWordId: wordId,
        source: 'manual',
        type: 'verb',
        meaningVi: 'tin tuong',
      },
    });

    await request(app.getHttpServer())
      .delete(`/vocab/definitions/${firstDefinitionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const deleteBody = parseResponseBody<DeleteDefinitionBody>(response);
        expect(deleteBody).toMatchObject({
          deletedDefinitionId: firstDefinitionId,
          vocabWordId: wordId,
          wordRemoved: false,
        });
        expect(deleteBody.word?.definitions).toHaveLength(1);
        expect(deleteBody.word?.definitions[0].id).toBe(secondDefinition.id);
      });

    await request(app.getHttpServer())
      .get(`/vocab/${wordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const wordBody = parseResponseBody<VocabWordBody>(response);
        expect(wordBody.definitions).toHaveLength(1);
        expect(wordBody.definitions[0].id).toBe(secondDefinition.id);
      });
  });

  it('searches vocabulary words', async () => {
    await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'hello',
          meaningVi: 'xin chao',
        }),
      )
      .expect(201);

    await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'shell',
          meaningVi: 'vo',
        }),
      )
      .expect(201);

    await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId, { search: 'he' }))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const listBody = parseResponseBody<VocabListBody>(response);
        expect(listBody.items).toHaveLength(2);
        const words = listBody.items.map((item) => item.word);
        expect(words).toContain('hello');
        expect(words).toContain('shell');
        expect(listBody.meta).toMatchObject({
          total: 2,
          hasMore: false,
        });
      });
  });

  it('returns vocabulary stats', async () => {
    await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'new word',
        }),
      )
      .expect(201);

    const masteredResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'mastered word',
          level: 7,
        }),
      )
      .expect(201);

    const difficultResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'difficult word',
          wrongCount: 3,
        }),
      )
      .expect(201);

    const masteredBody = parseResponseBody<VocabWordBody>(masteredResponse);
    const difficultBody = parseResponseBody<VocabWordBody>(difficultResponse);

    await request(app.getHttpServer())
      .patch(`/vocab/${masteredBody.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 7,
        wrongCount: 0,
        lastReview: '2999-01-01T00:00:00.000Z',
        nextReview: null,
      })
      .expect(200)
      .expect((response) => {
        expect(
          parseResponseBody<ReviewDefinitionBody>(response).nextReview,
        ).toBeNull();
      });

    await request(app.getHttpServer())
      .patch(`/vocab/${difficultBody.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 1,
        wrongCount: 3,
        lastReview: '2999-01-01T00:00:00.000Z',
        nextReview: '2999-01-02T00:00:00.000Z',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get(buildVocabStatsPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const statsBody = parseResponseBody<VocabStatsBody>(response);
        expect(statsBody).toMatchObject({
          total: 3,
          due: 1,
          mastered: 1,
          highWrongCount: 1,
        });
        expect(statsBody.levels).toHaveLength(8);
        expect(statsBody.levels).toContainEqual({
          level: 0,
          count: 1,
        });
        expect(statsBody.levels).toContainEqual({
          level: 1,
          count: 1,
        });
        expect(statsBody.levels).toContainEqual({
          level: 7,
          count: 1,
        });
      });
  });

  it('lists due review words only', async () => {
    const newWordResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'new word',
        }),
      )
      .expect(201);

    const dueWordResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'due word',
        }),
      )
      .expect(201);

    const futureWordResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'future word',
        }),
      )
      .expect(201);

    const masteredWordResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'mastered word',
        }),
      )
      .expect(201);

    const newWordBody = parseResponseBody<VocabWordBody>(newWordResponse);
    const dueWordBody = parseResponseBody<VocabWordBody>(dueWordResponse);
    const futureWordBody = parseResponseBody<VocabWordBody>(futureWordResponse);
    const masteredWordBody =
      parseResponseBody<VocabWordBody>(masteredWordResponse);

    await request(app.getHttpServer())
      .patch(`/vocab/${dueWordBody.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 1,
        wrongCount: 0,
        lastReview: '2000-01-01T00:00:00.000Z',
        nextReview: '2000-01-02T00:00:00.000Z',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/vocab/${futureWordBody.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 1,
        wrongCount: 0,
        lastReview: '2999-01-01T00:00:00.000Z',
        nextReview: '2999-01-02T00:00:00.000Z',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/vocab/${masteredWordBody.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 7,
        wrongCount: 0,
        lastReview: '2000-01-01T00:00:00.000Z',
        nextReview: null,
      })
      .expect(200);

    await request(app.getHttpServer())
      .get(
        `/vocab/review/due?limit=10&offset=0&collectionId=${defaultCollectionId}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const dueListBody = parseResponseBody<DueReviewListBody>(response);
        const ids = dueListBody.items.map((word) => word.id);

        expect(ids).toContain(newWordBody.definitions[0].id);
        expect(ids).toContain(dueWordBody.definitions[0].id);
        expect(ids).not.toContain(futureWordBody.definitions[0].id);
        expect(ids).not.toContain(masteredWordBody.definitions[0].id);
        expect(dueListBody.meta).toMatchObject({
          limit: 10,
          offset: 0,
          total: 2,
          hasMore: false,
        });
      });
  });

  it('returns not found when updating review for a missing word', () => {
    return request(app.getHttpServer())
      .patch('/vocab/00000000-0000-4000-8000-000000000000/review')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 3,
        wrongCount: 1,
        lastReview: '2026-06-07T00:00:00.000Z',
        nextReview: '2026-06-08T00:00:00.000Z',
      })
      .expect(404);
  });

  it('rejects malformed vocabulary ids', () => {
    return request(app.getHttpServer())
      .patch('/vocab/missing-id/review')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 3,
        wrongCount: 1,
        lastReview: '2026-06-07T00:00:00.000Z',
        nextReview: '2026-06-08T00:00:00.000Z',
      })
      .expect(400);
  });

  it('rejects invalid review dates', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'invalid review date',
        }),
      )
      .expect(201);

    const invalidReviewWordId =
      parseResponseBody<VocabWordBody>(createResponse).id;

    await request(app.getHttpServer())
      .patch(`/vocab/${invalidReviewWordId}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        level: 3,
        wrongCount: 1,
        lastReview: 'not-a-date',
        nextReview: '2026-06-08T00:00:00.000Z',
      })
      .expect(400);
  });

  it('allows adding another manual definition for the same word', async () => {
    const firstPayload = withDefaultCollection(defaultCollectionId, {
      word: 'hello',
      type: 'noun',
      meaningVi: 'xin chao',
    });
    const secondPayload = withDefaultCollection(defaultCollectionId, {
      word: 'hello',
      type: 'verb',
      meaningVi: 'chay',
    });

    const firstResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(firstPayload)
      .expect(201);

    const secondResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(secondPayload)
      .expect(201);

    const firstBody = parseResponseBody<VocabWordBody>(firstResponse);
    const secondBody = parseResponseBody<VocabWordBody>(secondResponse);

    expect(secondBody.id).toBe(firstBody.id);
    expect(secondBody.definitions).toHaveLength(2);
    expect(secondBody.definitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'manual',
          type: 'noun',
          meaningVi: 'xin chao',
        }),
        expect.objectContaining({
          source: 'manual',
          type: 'verb',
          meaningVi: 'chay',
        }),
      ]),
    );

    await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const listBody = parseResponseBody<VocabListBody>(response);
        expect(listBody.items).toHaveLength(1);
        expect(listBody.items[0].id).toBe(firstBody.id);
        expect(listBody.items[0].definitions).toHaveLength(2);
        expect(listBody.meta).toMatchObject({
          total: 1,
          hasMore: false,
        });
      });
  });

  it('allows creating the same word after soft delete', async () => {
    const payload = withDefaultCollection(defaultCollectionId, {
      word: 'hello',
    });

    const createResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    const createdBody = parseResponseBody<VocabWordBody>(createResponse);

    await request(app.getHttpServer())
      .delete(`/vocab/${createdBody.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const reAddResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    const reAddBody = parseResponseBody<VocabWordBody>(reAddResponse);

    expect(reAddBody.id).toBe(createdBody.id);
    expect(reAddBody).toMatchObject({
      word: 'hello',
      normalizedWord: 'hello',
      definitions: [expect.objectContaining({ deletedAt: null })],
    });

    await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const listBody = parseResponseBody<VocabListBody>(response);
        expect(listBody.items).toHaveLength(1);
        expect(listBody.items[0].id).toBe(reAddBody.id);
        expect(listBody.meta).toMatchObject({
          total: 1,
          hasMore: false,
        });
      });
  });
});
