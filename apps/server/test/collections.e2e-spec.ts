import { INestApplication } from '@nestjs/common';
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
          skipped: 1,
        });
      });
  });

  it('requires authentication', () => {
    return request(app.getHttpServer()).get('/collections').expect(401);
  });
});
