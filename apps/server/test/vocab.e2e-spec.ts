import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { registerE2eUser } from './helpers/e2e-auth';
import {
  buildVocabListPath,
  getDefaultCollectionId,
  withDefaultCollection,
} from './helpers/e2e-collections';
import { getE2ePrisma } from './helpers/e2e-prisma';
import { parseResponseBody } from './helpers/parse-response-body';

type VocabularyEntryBody = {
  id: string;
  word: string;
  normalizedWord: string;
  level: number;
  wrongCount: number;
};
type VocabularyListBody = {
  items: VocabularyEntryBody[];
  meta: { total: number };
};

describe('VocabController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let accessToken: string;
  let defaultCollectionId: string;
  const email = 'vocab-e2e@example.com';

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
    await prisma.user.deleteMany({ where: { email } });
    await app.init();
    const auth = await registerE2eUser(app.getHttpServer(), {
      email,
      password: 'test123456',
      name: 'Vocab E2E',
    });
    accessToken = auth.accessToken;
    defaultCollectionId = await getDefaultCollectionId(
      app.getHttpServer(),
      accessToken,
    );
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('creates flat entries, grades on the server, and hard deletes them', async () => {
    const create = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: ' Hello ',
          meaningVi: 'xin chao',
        }),
      )
      .expect(201);
    const entry = parseResponseBody<VocabularyEntryBody>(create);
    expect(entry).toMatchObject({
      word: 'Hello',
      normalizedWord: 'hello',
      level: 0,
      wrongCount: 0,
    });

    await request(app.getHttpServer())
      .patch(`/vocab/${entry.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 'FORGET' })
      .expect(200)
      .expect((response) => {
        expect(parseResponseBody<VocabularyEntryBody>(response)).toMatchObject({
          id: entry.id,
          level: 0,
          wrongCount: 1,
        });
      });

    await request(app.getHttpServer())
      .patch(`/vocab/${entry.id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 'MASTER' })
      .expect(200)
      .expect((response) => {
        expect(parseResponseBody(response)).toMatchObject({
          id: entry.id,
          level: 7,
          wrongCount: 1,
          nextReview: null,
        });
      });

    await request(app.getHttpServer())
      .delete(`/vocab/${entry.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) =>
        expect(parseResponseBody(response)).toEqual({
          deletedEntryId: entry.id,
        }),
      );

    await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) =>
        expect(parseResponseBody<VocabularyListBody>(response).meta.total).toBe(
          0,
        ),
      );
  });
});
