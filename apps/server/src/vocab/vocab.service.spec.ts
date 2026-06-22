import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { VocabService } from './vocab.service';
import {
  activeDefinitionsInclude,
  reviewDefinitionInclude,
} from './vocab.prisma-includes';
import { getMockCallArg } from '../testing/jest-mock-call';

describe('VocabService', () => {
  let service: VocabService;

  const collectionId = 'collection-id';

  const prismaMock = {
    wordCollection: {
      findFirst: jest.fn(),
    },
    vocabWord: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vocabWordDefinition: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const vocabWord = {
    id: 'word-id',
    userId: 'user-id',
    word: 'hello',
    normalizedWord: 'hello',
    definitions: [],
  };

  const reviewDefinition = {
    id: 'definition-id',
    vocabWordId: 'word-id',
    sourceDefinitionId: null,
    sourceWordId: null,
    type: null,
    meaningVi: null,
    definition: null,
    example: null,
    exampleVi: null,
    ipaUk: null,
    ipaUs: null,
    band: null,
    source: 'manual',
    level: 0,
    wrongCount: 0,
    lastReview: null,
    nextReview: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    vocabWord,
  };

  const activeWordWhere = {
    userId: 'user-id',
    collectionId,
    definitions: {
      some: {
        deletedAt: null,
      },
    },
  };

  const listQuery = {
    collectionId,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.wordCollection.findFirst.mockResolvedValue({ id: collectionId });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<VocabService>(VocabService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists active words for a user', async () => {
    prismaMock.vocabWord.findMany.mockResolvedValue([vocabWord]);
    prismaMock.vocabWord.count.mockResolvedValue(1);

    await expect(service.list('user-id', listQuery)).resolves.toEqual({
      items: [vocabWord],
      meta: {
        limit: 50,
        offset: 0,
        total: 1,
        hasMore: false,
      },
    });
    expect(prismaMock.vocabWord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: activeWordWhere,
        include: activeDefinitionsInclude,
        orderBy: {
          word: 'asc',
        },
        take: 50,
        skip: 0,
      }),
    );
    expect(prismaMock.vocabWord.count).toHaveBeenCalledWith({
      where: activeWordWhere,
    });
  });

  it('lists active words with pagination', async () => {
    prismaMock.vocabWord.findMany.mockResolvedValue([vocabWord]);
    prismaMock.vocabWord.count.mockResolvedValue(21);

    await expect(
      service.list('user-id', {
        collectionId,
        limit: 10,
        offset: 20,
      }),
    ).resolves.toMatchObject({
      meta: {
        limit: 10,
        offset: 20,
        total: 21,
        hasMore: false,
      },
    });

    expect(prismaMock.vocabWord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: activeWordWhere,
        include: activeDefinitionsInclude,
        orderBy: {
          word: 'asc',
        },
        take: 10,
        skip: 20,
      }),
    );
  });

  it('sets hasMore when more paginated words are available', async () => {
    prismaMock.vocabWord.findMany.mockResolvedValue([vocabWord]);
    prismaMock.vocabWord.count.mockResolvedValue(25);

    await expect(
      service.list('user-id', {
        collectionId,
        limit: 10,
        offset: 10,
      }),
    ).resolves.toMatchObject({
      meta: {
        hasMore: true,
      },
    });
  });

  it('lists active words with search filter', async () => {
    prismaMock.vocabWord.findMany.mockResolvedValue([vocabWord]);
    prismaMock.vocabWord.count.mockResolvedValue(1);

    await service.list('user-id', {
      collectionId,
      search: ' Hello ',
      limit: 10,
      offset: 0,
    });

    expect(prismaMock.vocabWord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ...activeWordWhere,
          normalizedWord: {
            contains: 'hello',
          },
        },
        include: activeDefinitionsInclude,
        orderBy: {
          word: 'asc',
        },
        take: 10,
        skip: 0,
      }),
    );
  });

  it('lists due review definitions for a user', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-07T00:00:00.000Z'));
    prismaMock.vocabWordDefinition.findMany.mockResolvedValue([
      reviewDefinition,
    ]);
    prismaMock.vocabWordDefinition.count.mockResolvedValue(25);

    try {
      await expect(
        service.listDueReviewWords('user-id', {
          limit: 10,
          offset: 20,
        }),
      ).resolves.toEqual({
        items: [reviewDefinition],
        meta: {
          limit: 10,
          offset: 20,
          total: 25,
          hasMore: true,
        },
      });

      expect(prismaMock.vocabWordDefinition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            level: {
              lt: 7,
            },
            vocabWord: {
              userId: 'user-id',
            },
            OR: [
              {
                nextReview: null,
              },
              {
                nextReview: {
                  lte: new Date('2026-06-07T00:00:00.000Z'),
                },
              },
            ],
          },
          include: reviewDefinitionInclude,
          orderBy: [
            {
              nextReview: 'asc',
            },
            {
              createdAt: 'asc',
            },
          ],
          take: 10,
          skip: 20,
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('gets an active word for a user', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(vocabWord);

    await expect(service.get('user-id', 'word-id')).resolves.toBe(vocabWord);
    expect(prismaMock.vocabWord.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'word-id',
          userId: 'user-id',
          definitions: {
            some: {
              deletedAt: null,
            },
          },
        },
        include: activeDefinitionsInclude,
      }),
    );
  });

  it('throws not found when getting a missing word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);

    await expect(service.get('user-id', 'missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a word with extended manual definition fields', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);
    prismaMock.vocabWord.create.mockResolvedValue(vocabWord);

    await service.create('user-id', { collectionId, 
      word: 'account',
      type: 'noun',
      ipaUk: '/əˈkaʊnt/',
      ipaUs: '/əˈkaʊnt/',
      meaningVi: 'tai khoan',
      definition: 'an arrangement with a bank',
      example: 'I opened a bank account.',
      exampleVi: 'Toi da mo tai khoan ngan hang.',
      band: 'A1',
    });

    expect(prismaMock.vocabWord.create).toHaveBeenCalledTimes(1);
    const accountCreateArgs = getMockCallArg<{
      data: {
        userId: string;
        word: string;
        normalizedWord: string;
        definitions: {
          create: {
            source: string;
            type: string;
            ipaUk: string;
            ipaUs: string;
            meaningVi: string;
            definition: string;
            example: string;
            exampleVi: string;
            band: string;
          };
        };
      };
      include: typeof activeDefinitionsInclude;
    }>(prismaMock.vocabWord.create);
    expect(accountCreateArgs.data).toMatchObject({
      userId: 'user-id',
      word: 'account',
      normalizedWord: 'account',
    });
    expect(accountCreateArgs.data.definitions.create).toMatchObject({
      source: 'manual',
      type: 'noun',
      ipaUk: '/əˈkaʊnt/',
      ipaUs: '/əˈkaʊnt/',
      meaningVi: 'tai khoan',
      definition: 'an arrangement with a bank',
      example: 'I opened a bank account.',
      exampleVi: 'Toi da mo tai khoan ngan hang.',
      band: 'A1',
    });
    expect(accountCreateArgs.include).toEqual(activeDefinitionsInclude);
  });

  it('creates a word with normalized word and manual definition', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);
    prismaMock.vocabWord.create.mockResolvedValue(vocabWord);

    await expect(
      service.create('user-id', { collectionId, 
        word: ' Hello ',
        meaningVi: 'xin chao',
      }),
    ).resolves.toBe(vocabWord);

    expect(prismaMock.vocabWord.create).toHaveBeenCalledTimes(1);
    const helloCreateArgs = getMockCallArg<{
      data: {
        userId: string;
        word: string;
        normalizedWord: string;
        definitions: {
          create: {
            source: string;
            meaningVi: string;
            level: number;
            wrongCount: number;
          };
        };
      };
      include: typeof activeDefinitionsInclude;
    }>(prismaMock.vocabWord.create);
    expect(helloCreateArgs.data).toMatchObject({
      userId: 'user-id',
      word: 'Hello',
      normalizedWord: 'hello',
    });
    expect(helloCreateArgs.data.definitions.create).toMatchObject({
      source: 'manual',
      meaningVi: 'xin chao',
      level: 0,
      wrongCount: 0,
    });
    expect(helloCreateArgs.include).toEqual(activeDefinitionsInclude);
  });

  it('adds a manual definition when the word already exists', async () => {
    const existingWord = {
      ...vocabWord,
      definitions: [reviewDefinition],
    };
    const updatedWord = {
      ...existingWord,
      definitions: [
        reviewDefinition,
        {
          ...reviewDefinition,
          id: 'definition-id-2',
          type: 'verb',
          meaningVi: 'chay',
        },
      ],
    };

    prismaMock.vocabWord.findFirst.mockResolvedValue(existingWord);
    prismaMock.vocabWord.update.mockResolvedValue(updatedWord);

    await expect(
      service.create('user-id', { collectionId, 
        word: 'hello',
        type: 'verb',
        meaningVi: 'chay',
      }),
    ).resolves.toBe(updatedWord);

    expect(prismaMock.vocabWord.create).not.toHaveBeenCalled();
    expect(prismaMock.vocabWord.update).toHaveBeenCalledTimes(1);
    const addDefinitionArgs = getMockCallArg<{
      where: { id: string };
      data: {
        definitions: {
          create: {
            source: string;
            type: string;
            meaningVi: string;
          };
        };
      };
      include: typeof activeDefinitionsInclude;
    }>(prismaMock.vocabWord.update);
    expect(addDefinitionArgs.where).toEqual({ id: 'word-id' });
    expect(addDefinitionArgs.data.definitions.create).toMatchObject({
      source: 'manual',
      type: 'verb',
      meaningVi: 'chay',
    });
    expect(addDefinitionArgs.include).toEqual(activeDefinitionsInclude);
  });

  it('restores word text when adding a definition to a word without active definitions', async () => {
    const existingWord = {
      ...vocabWord,
      definitions: [],
    };

    prismaMock.vocabWord.findFirst.mockResolvedValue(existingWord);
    prismaMock.vocabWord.update.mockResolvedValue({
      ...existingWord,
      word: 'Hello',
      definitions: [reviewDefinition],
    });

    await service.create('user-id', { collectionId, 
      word: ' Hello ',
      meaningVi: 'xin chao',
    });

    expect(prismaMock.vocabWord.update).toHaveBeenCalledTimes(1);
    const restoreWordArgs = getMockCallArg<{
      where: { id: string };
      data: {
        word: string;
        definitions: {
          create: {
            source: string;
            meaningVi: string;
          };
        };
      };
      include: typeof activeDefinitionsInclude;
    }>(prismaMock.vocabWord.update);
    expect(restoreWordArgs.where).toEqual({ id: 'word-id' });
    expect(restoreWordArgs.data).toMatchObject({
      word: 'Hello',
    });
    expect(restoreWordArgs.data.definitions.create).toMatchObject({
      source: 'manual',
      meaningVi: 'xin chao',
    });
    expect(restoreWordArgs.include).toEqual(activeDefinitionsInclude);
  });

  it('throws bad request when creating a blank word', async () => {
    await expect(
      service.create('user-id', { collectionId, 
        word: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.vocabWord.create).not.toHaveBeenCalled();
  });

  it('updates an active word and normalizes changed word', async () => {
    prismaMock.vocabWord.findFirst
      .mockResolvedValueOnce(vocabWord)
      .mockResolvedValueOnce({
        ...vocabWord,
        word: 'updated',
        normalizedWord: 'updated',
      });
    prismaMock.vocabWord.update.mockResolvedValue({
      ...vocabWord,
      word: 'updated',
      normalizedWord: 'updated',
    });

    await expect(
      service.update('user-id', 'word-id', {
        word: ' Updated ',
      }),
    ).resolves.toMatchObject({
      word: 'updated',
      normalizedWord: 'updated',
    });

    expect(prismaMock.vocabWord.update).toHaveBeenCalledWith({
      where: { id: 'word-id' },
      data: {
        word: 'Updated',
        normalizedWord: 'updated',
      },
    });
    expect(prismaMock.vocabWordDefinition.update).not.toHaveBeenCalled();
  });

  it('updates a definition in place when definition fields are changed', async () => {
    const wordWithDefinition = {
      ...vocabWord,
      definitions: [reviewDefinition],
    };

    prismaMock.vocabWord.findFirst
      .mockResolvedValueOnce(wordWithDefinition)
      .mockResolvedValueOnce(wordWithDefinition);
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(
      reviewDefinition,
    );
    prismaMock.vocabWordDefinition.update.mockResolvedValue({
      ...reviewDefinition,
      type: 'noun',
      meaningVi: 'xin chao',
    });

    await service.update('user-id', 'word-id', {
      definitionId: 'definition-id',
      type: 'noun',
      meaningVi: 'xin chao',
    });

    expect(prismaMock.vocabWordDefinition.update).toHaveBeenCalledWith({
      where: { id: 'definition-id' },
      data: {
        type: 'noun',
        meaningVi: 'xin chao',
      },
    });
    expect(prismaMock.vocabWord.update).not.toHaveBeenCalled();
  });

  it('updates an Oxford definition in place without changing source metadata', async () => {
    const oxfordDefinition = {
      ...reviewDefinition,
      id: 'oxford-definition-id',
      source: 'oxford_3000',
      sourceDefinitionId: 42,
      sourceWordId: 7,
      example: 'An example sentence.',
      exampleVi: 'Mot cau vi du.',
      ipaUs: '/test/',
      band: 'A1',
      level: 2,
      wrongCount: 1,
    };
    const wordWithDefinition = {
      ...vocabWord,
      definitions: [oxfordDefinition],
    };

    prismaMock.vocabWord.findFirst
      .mockResolvedValueOnce(wordWithDefinition)
      .mockResolvedValueOnce(wordWithDefinition);
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(
      oxfordDefinition,
    );
    prismaMock.vocabWordDefinition.update.mockResolvedValue({
      ...oxfordDefinition,
      meaningVi: 'nghia moi',
    });

    await service.update('user-id', 'word-id', {
      definitionId: 'oxford-definition-id',
      meaningVi: 'nghia moi',
    });

    const oxfordUpdateArgs = getMockCallArg<{
      where: { id: string };
      data: { meaningVi: string };
    }>(prismaMock.vocabWordDefinition.update);
    expect(oxfordUpdateArgs).toEqual({
      where: { id: 'oxford-definition-id' },
      data: {
        meaningVi: 'nghia moi',
      },
    });
    expect(oxfordUpdateArgs.data).not.toHaveProperty('source');
  });

  it('ignores word updates when editing an Oxford definition', async () => {
    const oxfordDefinition = {
      ...reviewDefinition,
      id: 'oxford-definition-id',
      source: 'oxford_3000',
    };
    const wordWithDefinition = {
      ...vocabWord,
      definitions: [oxfordDefinition],
    };

    prismaMock.vocabWord.findFirst
      .mockResolvedValueOnce(wordWithDefinition)
      .mockResolvedValueOnce(wordWithDefinition);
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(
      oxfordDefinition,
    );
    prismaMock.vocabWordDefinition.update.mockResolvedValue({
      ...oxfordDefinition,
      meaningVi: 'nghia moi',
    });

    await service.update('user-id', 'word-id', {
      definitionId: 'oxford-definition-id',
      word: 'changed',
      meaningVi: 'nghia moi',
    });

    expect(prismaMock.vocabWord.update).not.toHaveBeenCalled();
    expect(prismaMock.vocabWordDefinition.update).toHaveBeenCalledWith({
      where: { id: 'oxford-definition-id' },
      data: {
        meaningVi: 'nghia moi',
      },
    });
  });

  it('throws not found when updating missing word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-id', 'missing-id', {
        word: 'hello',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates review fields for an active definition', async () => {
    const lastReview = '2026-06-07T00:00:00.000Z';
    const nextReview = '2026-06-08T00:00:00.000Z';

    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(
      reviewDefinition,
    );
    prismaMock.vocabWordDefinition.update.mockResolvedValue({
      ...reviewDefinition,
      level: 2,
      wrongCount: 1,
      lastReview: new Date(lastReview),
      nextReview: new Date(nextReview),
    });

    await expect(
      service.updateReview('user-id', 'definition-id', {
        level: 2,
        wrongCount: 1,
        lastReview,
        nextReview,
      }),
    ).resolves.toMatchObject({
      level: 2,
      wrongCount: 1,
    });

    expect(prismaMock.vocabWordDefinition.update).toHaveBeenCalledWith({
      where: { id: 'definition-id' },
      data: {
        level: 2,
        wrongCount: 1,
        lastReview: new Date(lastReview),
        nextReview: new Date(nextReview),
      },
      include: reviewDefinitionInclude,
    });
  });

  it('allows clearing next review when a definition is mastered', async () => {
    const lastReview = '2026-06-07T00:00:00.000Z';

    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(
      reviewDefinition,
    );
    prismaMock.vocabWordDefinition.update.mockResolvedValue({
      ...reviewDefinition,
      level: 7,
      wrongCount: 0,
      lastReview: new Date(lastReview),
      nextReview: null,
    });

    await expect(
      service.updateReview('user-id', 'definition-id', {
        level: 7,
        wrongCount: 0,
        lastReview,
        nextReview: null,
      }),
    ).resolves.toMatchObject({
      level: 7,
      wrongCount: 0,
      nextReview: null,
    });
  });

  it('throws not found when updating review for a missing definition', async () => {
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(null);

    await expect(
      service.updateReview('user-id', 'missing-id', {
        level: 2,
        wrongCount: 1,
        lastReview: '2026-06-07T00:00:00.000Z',
        nextReview: '2026-06-08T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.vocabWordDefinition.update).not.toHaveBeenCalled();
  });

  it('throws bad request when updating to a blank word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(vocabWord);

    await expect(
      service.update('user-id', 'word-id', {
        word: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.vocabWord.update).not.toHaveBeenCalled();
  });

  it('does not use legacy word fallback when deleting by definition id', async () => {
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(null);

    await expect(
      service.softDeleteDefinition('user-id', 'word-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.vocabWordDefinition.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaMock.vocabWordDefinition.update).not.toHaveBeenCalled();
  });

  it('soft deletes the last definition and reports wordRemoved', async () => {
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(
      reviewDefinition,
    );
    prismaMock.vocabWordDefinition.update.mockResolvedValue({
      ...reviewDefinition,
      deletedAt: new Date(),
    });
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);

    await expect(
      service.softDeleteDefinition('user-id', 'definition-id'),
    ).resolves.toEqual({
      deletedDefinitionId: 'definition-id',
      vocabWordId: 'word-id',
      wordRemoved: true,
    });

    expect(prismaMock.vocabWordDefinition.update).toHaveBeenCalledTimes(1);
    const softDeleteArgs = getMockCallArg<{
      where: { id: string };
      data: { deletedAt: Date };
    }>(prismaMock.vocabWordDefinition.update);
    expect(softDeleteArgs.where).toEqual({ id: 'definition-id' });
    expect(softDeleteArgs.data.deletedAt).toBeInstanceOf(Date);
    expect(prismaMock.vocabWord.findUnique).not.toHaveBeenCalled();
  });

  it('soft deletes one definition and returns the remaining word', async () => {
    const remainingDefinition = {
      ...reviewDefinition,
      id: 'remaining-definition-id',
    };
    const wordWithRemainingDefinition = {
      ...vocabWord,
      definitions: [remainingDefinition],
    };

    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(
      reviewDefinition,
    );
    prismaMock.vocabWordDefinition.update.mockResolvedValue({
      ...reviewDefinition,
      deletedAt: new Date(),
    });
    prismaMock.vocabWord.findFirst.mockResolvedValue(
      wordWithRemainingDefinition,
    );

    await expect(
      service.softDeleteDefinition('user-id', 'definition-id'),
    ).resolves.toEqual({
      deletedDefinitionId: 'definition-id',
      vocabWordId: 'word-id',
      wordRemoved: false,
      word: wordWithRemainingDefinition,
    });
  });

  it('throws not found when deleting missing definition', async () => {
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(null);

    await expect(
      service.softDeleteDefinition('user-id', 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft deletes active definitions for a word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(vocabWord);
    prismaMock.vocabWordDefinition.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.vocabWord.findUnique.mockResolvedValue({
      ...vocabWord,
      definitions: [],
    });

    await service.softDelete('user-id', 'word-id');

    expect(prismaMock.vocabWordDefinition.updateMany).toHaveBeenCalledTimes(1);
    const bulkSoftDeleteArgs = getMockCallArg<{
      where: { vocabWordId: string; deletedAt: null };
      data: { deletedAt: Date };
    }>(prismaMock.vocabWordDefinition.updateMany);
    expect(bulkSoftDeleteArgs.where).toEqual({
      vocabWordId: 'word-id',
      deletedAt: null,
    });
    expect(bulkSoftDeleteArgs.data.deletedAt).toBeInstanceOf(Date);
    expect(prismaMock.vocabWord.update).not.toHaveBeenCalled();
  });

  it('throws not found when deleting missing word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);

    await expect(
      service.softDelete('user-id', 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
