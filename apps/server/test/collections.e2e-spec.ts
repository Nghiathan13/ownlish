import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CollectionsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
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
    prisma = app.get(PrismaService);

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
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Collections E2E',
      })
      .expect(201);

    accessToken = registerResponse.body.accessToken;
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
        expect(response.body).toEqual(
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
        expect(response.body.catalogWords).toHaveLength(1);
        expect(response.body.catalogWords[0]).toMatchObject({
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
        expect(response.body).toEqual({
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
        expect(response.body).toEqual({
          imported: 0,
          updated: 0,
          skipped: 1,
        });
      });

    const vocabListResponse = await request(app.getHttpServer())
      .get('/vocab')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const importedWord = vocabListResponse.body.items[0];
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
        expect(response.body.definitions).toHaveLength(1);
        expect(response.body.definitions[0]).toMatchObject({
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

    expect(manualAddResponse.body.id).toBe(importedWord.id);
    expect(manualAddResponse.body.definitions).toHaveLength(2);

    const manualDefinition = manualAddResponse.body.definitions.find(
      (definition: { source: string }) => definition.source === 'manual',
    );

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
        expect(response.body.definitions).toHaveLength(2);
        expect(response.body.definitions).toEqual(
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
        expect(response.body).toEqual({
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
