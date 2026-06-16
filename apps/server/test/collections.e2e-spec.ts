import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { registerE2eUser } from './helpers/e2e-auth';
import type {
  CollectionCatalogBody,
  CollectionImportBody,
  CollectionSummaryBody,
} from './helpers/e2e-collection-types';
import { getE2ePrisma } from './helpers/e2e-prisma';
import { parseResponseBody } from './helpers/parse-response-body';
import type { VocabListBody, VocabWordBody } from './helpers/e2e-vocab-types';

describe('CollectionsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let accessToken: string;
  let collectionId: string;

  const email = 'collections-e2e@example.com';
  const password = 'test123456';
  const normalizedWord = 'e2e-catalog-word';

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
    await prisma.catalogWord.deleteMany({
      where: { normalizedWord },
    });
    await prisma.wordCollection.deleteMany({
      where: {
        source: 'test',
        cefrLevel: 'A1',
      },
    });

    await app.init();

    const catalogWord = await prisma.catalogWord.create({
      data: {
        word: 'e2e catalog word',
        normalizedWord,
        definitions: {
          create: {
            sourceDefinitionId: 999001,
            sourceWordId: 999001,
            type: 'noun',
            meaningVi: 'tu e2e',
            example: 'This is an e2e catalog word.',
            band: 'A1',
            source: 'oxford_3000',
          },
        },
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
        catalogItems: {
          create: {
            catalogWordId: catalogWord.id,
            sortOrder: 0,
          },
        },
      },
    });
    const auth = await registerE2eUser(app.getHttpServer(), {
      email,
      password,
      name: 'Collections E2E',
    });
    accessToken = auth.accessToken;
    collectionId = collection.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email },
    });
    await prisma.catalogWord.deleteMany({
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

  it('lists, reads, and imports a system collection', async () => {
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
              id: collectionId,
              itemCount: 1,
              kind: 'SYSTEM',
              name: 'Oxford E2E A1',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get(`/collections/${collectionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const collectionDetail =
          parseResponseBody<CollectionCatalogBody>(response);
        expect(collectionDetail.catalogWords).toHaveLength(1);
        expect(collectionDetail.catalogWords[0]).toMatchObject({
          word: 'e2e catalog word',
          definitions: [
            expect.objectContaining({
              band: 'A1',
              meaningVi: 'tu e2e',
              type: 'noun',
            }),
          ],
        });
      });

    await request(app.getHttpServer())
      .post(`/collections/${collectionId}/import`)
      .set('Authorization', `Bearer ${accessToken}`)
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
      .expect(201)
      .expect((response) => {
        expect(parseResponseBody<CollectionImportBody>(response)).toEqual({
          imported: 0,
          updated: 0,
          skipped: 1,
        });
      });

    const vocabListResponse = await request(app.getHttpServer())
      .get('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const vocabListBody = parseResponseBody<VocabListBody>(vocabListResponse);
    const importedWord = vocabListBody.items[0];
    const importedDefinition = importedWord.definitions[0];

    await request(app.getHttpServer())
      .patch(`/vocab/${importedWord.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        definitionId: importedDefinition.id,
        meaningVi: 'nghia da sua',
      })
      .expect(200)
      .expect((response) => {
        const updatedWord = parseResponseBody<VocabWordBody>(response);
        expect(updatedWord.definitions).toHaveLength(1);
        expect(updatedWord.definitions[0]).toMatchObject({
          id: importedDefinition.id,
          source: 'oxford_3000',
          sourceDefinitionId: 999001,
          sourceWordId: 999001,
          example: 'This is an e2e catalog word.',
          band: 'A1',
          meaningVi: 'nghia da sua',
          type: 'noun',
        });
      });

    const manualAddResponse = await request(app.getHttpServer())
      .post('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word: 'e2e catalog word',
        type: 'verb',
        meaningVi: 'nghia manual',
      })
      .expect(201);

    const manualAddBody = parseResponseBody<VocabWordBody>(manualAddResponse);

    expect(manualAddBody.id).toBe(importedWord.id);
    expect(manualAddBody.definitions).toHaveLength(2);

    const manualDefinition = manualAddBody.definitions.find(
      (definition) => definition.source === 'manual',
    );
    if (!manualDefinition) {
      throw new Error('Expected a manual definition');
    }

    expect(manualDefinition).toMatchObject({
      source: 'manual',
      type: 'verb',
      meaningVi: 'nghia manual',
    });

    await request(app.getHttpServer())
      .patch(`/vocab/${importedWord.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        definitionId: manualDefinition.id,
        meaningVi: 'nghia manual da sua',
      })
      .expect(200)
      .expect((response) => {
        const updatedWord = parseResponseBody<VocabWordBody>(response);
        expect(updatedWord.definitions).toHaveLength(2);
        expect(updatedWord.definitions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: importedDefinition.id,
              source: 'oxford_3000',
              meaningVi: 'nghia da sua',
            }),
            expect.objectContaining({
              id: manualDefinition.id,
              source: 'manual',
              meaningVi: 'nghia manual da sua',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .post(`/collections/${collectionId}/import`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)
      .expect((response) => {
        expect(parseResponseBody<CollectionImportBody>(response)).toEqual({
          imported: 0,
          updated: 0,
          skipped: 1,
        });
      });
  });

  it('requires authentication', () => {
    return request(app.getHttpServer()).get('/collections').expect(401);
  });
});
