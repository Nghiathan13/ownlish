import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { VocabService } from './vocab.service';

describe('VocabService', () => {
  let service: VocabService;

  const prismaMock = {
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
    definitions: {
      some: {
        deletedAt: null,
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

    await expect(service.list('user-id')).resolves.toEqual({
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
        include: expect.objectContaining({ definitions: expect.any(Object) }),
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
        include: expect.objectContaining({ definitions: expect.any(Object) }),
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
        include: expect.objectContaining({ definitions: expect.any(Object) }),
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
          include: expect.objectContaining({ vocabWord: true }),
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
          ...activeWordWhere,
        },
        include: expect.objectContaining({ definitions: expect.any(Object) }),
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
    prismaMock.vocabWord.create.mockResolvedValue(vocabWord);

    await service.create('user-id', {
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

    expect(prismaMock.vocabWord.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        word: 'account',
        normalizedWord: 'account',
        definitions: {
          create: expect.objectContaining({
            source: 'manual',
            type: 'noun',
            ipaUk: '/əˈkaʊnt/',
            ipaUs: '/əˈkaʊnt/',
            meaningVi: 'tai khoan',
            definition: 'an arrangement with a bank',
            example: 'I opened a bank account.',
            exampleVi: 'Toi da mo tai khoan ngan hang.',
            band: 'A1',
          }),
        },
      },
      include: expect.objectContaining({ definitions: expect.any(Object) }),
    });
  });

  it('creates a word with normalized word and manual definition', async () => {
    prismaMock.vocabWord.create.mockResolvedValue(vocabWord);

    await expect(
      service.create('user-id', {
        word: ' Hello ',
        meaningVi: 'xin chao',
      }),
    ).resolves.toBe(vocabWord);

    expect(prismaMock.vocabWord.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        word: 'Hello',
        normalizedWord: 'hello',
        definitions: {
          create: expect.objectContaining({
            source: 'manual',
            meaningVi: 'xin chao',
            level: 0,
            wrongCount: 0,
          }),
        },
      },
      include: expect.objectContaining({ definitions: expect.any(Object) }),
    });
  });

  it('throws conflict when creating duplicate word', async () => {
    prismaMock.vocabWord.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create('user-id', {
        word: 'hello',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws bad request when creating a blank word', async () => {
    await expect(
      service.create('user-id', {
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
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(reviewDefinition);
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
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(oxfordDefinition);
    prismaMock.vocabWordDefinition.update.mockResolvedValue({
      ...oxfordDefinition,
      meaningVi: 'nghia moi',
    });

    await service.update('user-id', 'word-id', {
      definitionId: 'oxford-definition-id',
      meaningVi: 'nghia moi',
    });

    expect(prismaMock.vocabWordDefinition.update).toHaveBeenCalledWith({
      where: { id: 'oxford-definition-id' },
      data: {
        meaningVi: 'nghia moi',
      },
    });
    expect(prismaMock.vocabWordDefinition.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'manual',
        }),
      }),
    );
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
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(oxfordDefinition);
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

    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(reviewDefinition);
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
      include: expect.objectContaining({ vocabWord: true }),
    });
  });

  it('allows clearing next review when a definition is mastered', async () => {
    const lastReview = '2026-06-07T00:00:00.000Z';

    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(reviewDefinition);
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

  it('soft deletes a single definition', async () => {
    prismaMock.vocabWordDefinition.findFirst.mockResolvedValue(reviewDefinition);
    prismaMock.vocabWordDefinition.update.mockResolvedValue({
      ...reviewDefinition,
      deletedAt: new Date(),
    });
    prismaMock.vocabWord.findUnique.mockResolvedValue({
      ...vocabWord,
      definitions: [],
    });

    await service.softDeleteDefinition('user-id', 'definition-id');

    expect(prismaMock.vocabWordDefinition.update).toHaveBeenCalledWith({
      where: { id: 'definition-id' },
      data: {
        deletedAt: expect.any(Date),
      },
    });
    expect(prismaMock.vocabWordDefinition.updateMany).not.toHaveBeenCalled();
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

    expect(prismaMock.vocabWordDefinition.updateMany).toHaveBeenCalledWith({
      where: {
        vocabWordId: 'word-id',
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
      },
    });
    expect(prismaMock.vocabWord.update).not.toHaveBeenCalled();
  });

  it('throws not found when deleting missing word', async () => {
    prismaMock.vocabWord.findFirst.mockResolvedValue(null);

    await expect(
      service.softDelete('user-id', 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
