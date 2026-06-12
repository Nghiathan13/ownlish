import { BadRequestException } from '@nestjs/common';
import { WordCollectionKind } from '@prisma/client';
import { CollectionsService } from './collections.service';

describe('CollectionsService', () => {
  const now = new Date('2026-06-13T00:00:00.000Z');
  const collection = {
    id: 'collection-id',
    name: 'Oxford A1',
    description: 'Oxford vocabulary words for CEFR A1.',
    kind: WordCollectionKind.SYSTEM,
    source: 'oxford',
    cefrLevel: 'A1',
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  };
  const prisma = {
    collectionCatalogItem: {
      findMany: jest.fn(),
    },
    vocabWord: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    wordCollection: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const service = new CollectionsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists visible collections with item counts', async () => {
    prisma.wordCollection.findMany.mockResolvedValue([
      {
        ...collection,
        _count: {
          catalogItems: 10,
          userWordItems: 0,
        },
      },
    ]);

    await expect(service.list('user-id')).resolves.toEqual([
      {
        ...collection,
        itemCount: 10,
      },
    ]);
    expect(prisma.wordCollection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              kind: WordCollectionKind.SYSTEM,
              isPublic: true,
            },
            {
              ownerUserId: 'user-id',
            },
          ],
        },
      }),
    );
  });

  it('imports system collection words and skips duplicates', async () => {
    prisma.wordCollection.findFirst.mockResolvedValue(collection);
    prisma.collectionCatalogItem.findMany.mockResolvedValue([
      {
        catalogWord: {
          id: 'catalog-word-id',
          word: 'about',
          normalizedWord: 'about',
          definitions: [
            {
              id: 'definition-1',
              type: 'adverb',
              meaningVi: 'khoảng',
              definition: null,
              example: 'There were about twenty people there.',
              exampleVi: null,
              ipaUk: '/əˈbaʊt/',
              ipaUs: '/əˈbaʊt/',
              band: 'A1',
              source: 'oxford_3000',
            },
            {
              id: 'definition-2',
              type: 'preposition',
              meaningVi: 'về',
              definition: null,
              example: 'We talked about school.',
              exampleVi: null,
              ipaUk: '/əˈbaʊt/',
              ipaUs: '/əˈbaʊt/',
              band: 'A1',
              source: 'oxford_3000',
            },
          ],
        },
      },
    ]);
    prisma.vocabWord.createMany.mockResolvedValue({ count: 0 });

    await expect(
      service.importToVocabulary('user-id', 'collection-id'),
    ).resolves.toEqual({
      imported: 0,
      skipped: 1,
    });
    expect(prisma.vocabWord.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          band: 'A1',
          example: 'There were about twenty people there.',
          ipa: '/əˈbaʊt/',
          meaningVi: 'khoảng; về',
          normalizedWord: 'about',
          type: 'adverb; preposition',
          userId: 'user-id',
          word: 'about',
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('rejects importing user collections', async () => {
    prisma.wordCollection.findFirst.mockResolvedValue({
      ...collection,
      kind: WordCollectionKind.USER,
      ownerUserId: 'user-id',
    });

    await expect(
      service.importToVocabulary('user-id', 'collection-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
