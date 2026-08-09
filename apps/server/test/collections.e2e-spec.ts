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
import type {
  CollectionCatalogBody,
  CollectionCatalogPageBody,
  CollectionImportBody,
  CollectionSummaryBody,
} from './helpers/e2e-collection-types';
import { getE2ePrisma } from './helpers/e2e-prisma';
import { parseResponseBody } from './helpers/parse-response-body';
import type {
  VocabListBody,
  VocabularyEntryBody,
} from './helpers/e2e-vocab-types';

describe('CollectionsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let accessToken: string;
  let collectionId: string;
  let defaultCollectionId: string;

  const email = 'collections-e2e@example.com';
  const password = 'test123456';
  const normalizedWord = 'e2e-catalog-word';
  const systemEntryId = 'e2e-catalog-entry';

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
    await prisma.systemVocabularyEntry.deleteMany({
      where: { normalizedWord },
    });
    await prisma.wordCollection.deleteMany({
      where: {
        source: 'test',
        cefrLevel: 'A1',
      },
    });

    await app.init();

    await prisma.systemVocabularyEntry.create({
      data: {
        id: systemEntryId,
        word: 'e2e catalog word',
        normalizedWord,
        sourceWordId: 999001,
        type: 'noun',
        meaningVi: 'tu e2e',
        example: 'This is an e2e catalog word.',
        band: 'A1',
        source: 'oxford_3000',
        sortOrder: -1,
      },
    });
    const collection = await prisma.wordCollection.create({
      data: {
        name: 'Oxford E2E A1',
        description: 'E2E collection',
        kind: 'SYSTEM',
        source: 'test',
        cefrLevel: 'A1',
        isPublic: true,
      },
    });
    const auth = await registerE2eUser(app.getHttpServer(), {
      email,
      password,
      name: 'Collections E2E',
    });
    accessToken = auth.accessToken;
    collectionId = collection.id;
    defaultCollectionId = await getDefaultCollectionId(
      app.getHttpServer(),
      accessToken,
    );
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email },
    });
    await prisma.systemVocabularyEntry.deleteMany({
      where: { normalizedWord },
    });
    await prisma.wordCollection.deleteMany({
      where: {
        source: 'test',
        cefrLevel: 'A1',
      },
    });
    await app.close();
  });

  it('creates a user collection', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/collections')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'My Study List',
        description: 'Custom words',
      })
      .expect(201);

    const created = parseResponseBody<CollectionSummaryBody>(createResponse);
    expect(created).toMatchObject({
      kind: 'USER',
      name: 'My Study List',
      itemCount: 0,
    });

    await request(app.getHttpServer())
      .get('/collections')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const collections =
          parseResponseBody<CollectionSummaryBody[]>(response);
        expect(collections).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: created.id,
              kind: 'USER',
              name: 'My Study List',
            }),
          ]),
        );
      });
  });

  it('lists, reads, and imports a system collection', async () => {
    await request(app.getHttpServer())
      .get('/collections')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const collections =
          parseResponseBody<CollectionSummaryBody[]>(response);
        const collection = collections.find((item) => item.id === collectionId);
        expect(collection).toMatchObject({
          id: collectionId,
          kind: 'SYSTEM',
          name: 'Oxford E2E A1',
        });
        expect(collection?.itemCount).toBeGreaterThanOrEqual(1);
      });

    await request(app.getHttpServer())
      .get(`/collections/${collectionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const collectionDetail =
          parseResponseBody<CollectionCatalogBody>(response);
        expect(collectionDetail.catalogWords).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              word: 'e2e catalog word',
              definitions: [
                expect.objectContaining({
                  band: 'A1',
                  meaningVi: 'tu e2e',
                  type: 'noun',
                }),
              ],
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get(`/collections/${collectionId}/catalog-words?offset=0&limit=20`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const page = parseResponseBody<CollectionCatalogPageBody>(response);
        expect(page).toMatchObject({ limit: 20, offset: 0 });
        expect(page.total).toBeGreaterThanOrEqual(1);
        expect(page.items).toHaveLength(Math.min(20, page.total));
        expect(page.items[0]).toMatchObject({ word: 'e2e catalog word' });
      });

    await request(app.getHttpServer())
      .get(`/collections/${collectionId}/catalog-words?offset=0&limit=21`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    await request(app.getHttpServer())
      .post(`/collections/${collectionId}/import`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ catalogDefinitionIds: [systemEntryId] })
      .expect(201)
      .expect((response) => {
        expect(parseResponseBody<CollectionImportBody>(response)).toEqual({
          imported: 1,
          updated: 0,
          skipped: 0,
        });
      });

    await request(app.getHttpServer())
      .post(`/collections/${collectionId}/import`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ catalogDefinitionIds: [systemEntryId] })
      .expect(201)
      .expect((response) => {
        expect(parseResponseBody<CollectionImportBody>(response)).toEqual({
          imported: 0,
          updated: 0,
          skipped: 1,
        });
      });

    const vocabListResponse = await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const vocabListBody = parseResponseBody<VocabListBody>(vocabListResponse);
    const importedEntry = vocabListBody.items[0];

    await request(app.getHttpServer())
      .patch(`/vocab/${importedEntry.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        meaningVi: 'nghia da sua',
      })
      .expect(200)
      .expect((response) => {
        expect(parseResponseBody<VocabularyEntryBody>(response)).toMatchObject({
          id: importedEntry.id,
          source: 'oxford_3000',
          systemEntryId,
          example: 'This is an e2e catalog word.',
          band: 'A1',
          meaningVi: 'nghia da sua',
          type: 'noun',
        });
      });

    const manualAddResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(
        withDefaultCollection(defaultCollectionId, {
          word: 'e2e catalog word',
          type: 'verb',
          meaningVi: 'nghia manual',
        }),
      )
      .expect(201);

    const manualEntry =
      parseResponseBody<VocabularyEntryBody>(manualAddResponse);

    expect(manualEntry.id).not.toBe(importedEntry.id);
    expect(manualEntry).toMatchObject({
      source: 'manual',
      type: 'verb',
      meaningVi: 'nghia manual',
    });

    await request(app.getHttpServer())
      .patch(`/vocab/${manualEntry.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        meaningVi: 'nghia manual da sua',
      })
      .expect(200)
      .expect((response) => {
        expect(parseResponseBody<VocabularyEntryBody>(response)).toMatchObject({
          id: manualEntry.id,
          source: 'manual',
          meaningVi: 'nghia manual da sua',
        });
      });

    const entriesResponse = await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(parseResponseBody<VocabListBody>(entriesResponse).meta.total).toBe(
      2,
    );

    await request(app.getHttpServer())
      .post(`/collections/${collectionId}/import`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ catalogDefinitionIds: [systemEntryId] })
      .expect(201)
      .expect((response) => {
        expect(parseResponseBody<CollectionImportBody>(response)).toEqual({
          imported: 0,
          updated: 0,
          skipped: 1,
        });
      });
  });

  it('imports only selected catalog definitions by id', async () => {
    const partialImportWord = 'e2e partial import word';
    const partialImportNormalizedWord = 'e2e-partial-import-word';
    const catalogDefinitionId = 'oxford-def-e2e-partial-import';

    await prisma.systemVocabularyEntry.deleteMany({
      where: { normalizedWord: partialImportNormalizedWord },
    });

    await prisma.systemVocabularyEntry.createMany({
      data: [
        {
          id: catalogDefinitionId,
          word: partialImportWord,
          normalizedWord: partialImportNormalizedWord,
          sourceWordId: 999101,
          type: 'noun',
          meaningVi: 'tu chon',
          band: 'A1',
          source: 'oxford_3000',
          sortOrder: 99_901,
        },
        {
          id: 'oxford-def-e2e-partial-import-second',
          word: partialImportWord,
          normalizedWord: partialImportNormalizedWord,
          sourceWordId: 999101,
          type: 'verb',
          meaningVi: 'tu bo qua',
          band: 'A1',
          source: 'oxford_3000',
          sortOrder: 99_902,
        },
      ],
    });

    await request(app.getHttpServer())
      .post(`/collections/${collectionId}/import`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        targetCollectionId: defaultCollectionId,
        catalogDefinitionIds: [catalogDefinitionId],
      })
      .expect(201)
      .expect((response) => {
        expect(parseResponseBody<CollectionImportBody>(response)).toEqual({
          imported: 1,
          updated: 0,
          skipped: 0,
        });
      });

    const vocabListResponse = await request(app.getHttpServer())
      .get(buildVocabListPath(defaultCollectionId))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const vocabListBody = parseResponseBody<VocabListBody>(vocabListResponse);
    const importedEntry = vocabListBody.items.find(
      (item) => item.word === partialImportWord,
    );

    expect(importedEntry).toMatchObject({
      word: partialImportWord,
      systemEntryId: catalogDefinitionId,
      type: 'noun',
      meaningVi: 'tu chon',
    });

    await prisma.systemVocabularyEntry.deleteMany({
      where: { normalizedWord: partialImportNormalizedWord },
    });
  });

  it('requires authentication', () => {
    return request(app.getHttpServer()).get('/collections').expect(401);
  });
});
