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
    isDefault: false,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  };
  const defaultCollection = {
    id: 'default-collection-id',
    name: 'My Vocabulary',
    description: null,
    kind: WordCollectionKind.USER,
    source: null,
    cefrLevel: null,
    isDefault: true,
    isPublic: false,
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
    vocabWordDefinition: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    wordCollection: {
      create: jest.fn(),
      delete: jest.fn(),
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
          vocabWords: 0,
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

  it('creates a user-owned collection', async () => {
    prisma.wordCollection.create.mockResolvedValue({
      ...collection,
      kind: WordCollectionKind.USER,
      source: null,
      cefrLevel: null,
      isDefault: false,
      isPublic: false,
      name: 'TOEIC Prep',
      description: 'Words for exam prep',
      _count: {
        catalogItems: 0,
        vocabWords: 0,
      },
    });

    await expect(
      service.createUserCollection('user-id', {
        name: '  TOEIC Prep  ',
        description: ' Words for exam prep ',
      }),
    ).resolves.toEqual({
      id: 'collection-id',
      name: 'TOEIC Prep',
      description: 'Words for exam prep',
      kind: WordCollectionKind.USER,
      source: null,
      cefrLevel: null,
      isDefault: false,
      isPublic: false,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    expect(prisma.wordCollection.create).toHaveBeenCalledWith({
      data: {
        kind: WordCollectionKind.USER,
        ownerUserId: 'user-id',
        name: 'TOEIC Prep',
        description: 'Words for exam prep',
        isDefault: false,
        isPublic: false,
      },
      include: {
        _count: {
          select: {
            catalogItems: true,
            vocabWords: true,
          },
        },
      },
    });
  });

  it('rejects deleting the default collection', async () => {
    prisma.wordCollection.findFirst.mockResolvedValue(defaultCollection);

    await expect(
      service.deleteUserCollection('user-id', 'default-collection-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.wordCollection.delete).not.toHaveBeenCalled();
  });

  it('rejects creating a user collection without a name', async () => {
    await expect(
      service.createUserCollection('user-id', { name: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.wordCollection.create).not.toHaveBeenCalled();
  });

  it('imports new words and merges definitions into existing words', async () => {
    prisma.wordCollection.findFirst
      .mockResolvedValueOnce(collection)
      .mockResolvedValueOnce(defaultCollection);
    prisma.collectionCatalogItem.findMany.mockResolvedValue([
      {
        catalogWord: {
          id: 'catalog-word-id',
          word: 'about',
          normalizedWord: 'about',
          definitions: [
            {
              id: 'definition-1',
              sourceDefinitionId: 1001,
              sourceWordId: 101,
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
              sourceDefinitionId: 1002,
              sourceWordId: 101,
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
    prisma.vocabWord.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'vocab-word-id',
        normalizedWord: 'about',
      },
    ]);
    prisma.vocabWord.createMany.mockResolvedValue({ count: 1 });
    prisma.vocabWordDefinition.findMany.mockResolvedValue([]);
    prisma.vocabWordDefinition.createMany.mockResolvedValue({ count: 2 });

    await expect(
      service.importToVocabulary('user-id', 'collection-id'),
    ).resolves.toEqual({
      imported: 1,
      updated: 0,
      skipped: 0,
    });
    expect(prisma.vocabWord.createMany).toHaveBeenCalledWith({
      data: [
        {
          collectionId: 'default-collection-id',
          normalizedWord: 'about',
          userId: 'user-id',
          word: 'about',
        },
      ],
      skipDuplicates: true,
    });
    expect(prisma.vocabWordDefinition.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          vocabWordId: 'vocab-word-id',
          sourceDefinitionId: 1001,
          type: 'adverb',
          meaningVi: 'khoảng',
        }),
        expect.objectContaining({
          vocabWordId: 'vocab-word-id',
          sourceDefinitionId: 1002,
          type: 'preposition',
          meaningVi: 'về',
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('imports only selected catalog definitions when ids are provided', async () => {
    prisma.wordCollection.findFirst
      .mockResolvedValueOnce(collection)
      .mockResolvedValueOnce(defaultCollection);
    prisma.collectionCatalogItem.findMany.mockResolvedValue([
      {
        catalogWord: {
          id: 'catalog-word-id',
          word: 'about',
          normalizedWord: 'about',
          definitions: [
            {
              id: 'definition-1',
              sourceDefinitionId: 1001,
              sourceWordId: 101,
              type: 'adverb',
              meaningVi: 'khoảng',
              definition: null,
              example: null,
              exampleVi: null,
              ipaUk: '/əˈbaʊt/',
              ipaUs: '/əˈbaʊt/',
              band: 'A1',
              source: 'oxford_3000',
            },
            {
              id: 'definition-2',
              sourceDefinitionId: 1002,
              sourceWordId: 101,
              type: 'preposition',
              meaningVi: 'về',
              definition: null,
              example: null,
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
    prisma.vocabWord.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'vocab-word-id',
        normalizedWord: 'about',
      },
    ]);
    prisma.vocabWord.createMany.mockResolvedValue({ count: 1 });
    prisma.vocabWordDefinition.findMany.mockResolvedValue([]);
    prisma.vocabWordDefinition.createMany.mockResolvedValue({ count: 1 });

    await expect(
      service.importToVocabulary('user-id', 'collection-id', {
        catalogDefinitionIds: ['definition-1'],
      }),
    ).resolves.toEqual({
      imported: 1,
      updated: 0,
      skipped: 0,
    });
    expect(prisma.vocabWordDefinition.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          vocabWordId: 'vocab-word-id',
          sourceDefinitionId: 1001,
          type: 'adverb',
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('updates existing words when collection adds new definitions', async () => {
    prisma.wordCollection.findFirst
      .mockResolvedValueOnce(collection)
      .mockResolvedValueOnce(defaultCollection);
    prisma.collectionCatalogItem.findMany.mockResolvedValue([
      {
        catalogWord: {
          id: 'catalog-word-id',
          word: 'account',
          normalizedWord: 'account',
          definitions: [
            {
              id: 'definition-1',
              sourceDefinitionId: 2001,
              sourceWordId: 201,
              type: 'noun',
              meaningVi: 'tài khoản',
              definition: null,
              example: null,
              exampleVi: null,
              ipaUk: null,
              ipaUs: null,
              band: 'B2',
              source: 'oxford_5000',
            },
          ],
        },
      },
    ]);
    prisma.vocabWord.findMany
      .mockResolvedValueOnce([
        {
          id: 'existing-word-id',
          normalizedWord: 'account',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'existing-word-id',
          normalizedWord: 'account',
        },
      ]);
    prisma.vocabWord.createMany.mockResolvedValue({ count: 0 });
    prisma.vocabWordDefinition.findMany.mockResolvedValue([]);
    prisma.vocabWordDefinition.createMany.mockResolvedValue({ count: 1 });

    await expect(
      service.importToVocabulary('user-id', 'collection-id'),
    ).resolves.toEqual({
      imported: 0,
      updated: 1,
      skipped: 0,
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
