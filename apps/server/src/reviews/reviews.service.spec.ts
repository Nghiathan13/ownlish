import { NotFoundException } from '@nestjs/common';
import { OxfordReviewRating } from './dto/grade-oxford-word.dto';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  const now = new Date('2026-07-24T10:00:00.000Z');
  const prisma = {
    systemVocabularyEntry: {
      findMany: jest.fn(),
    },
    userDefinitionProgress: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const service = new ReviewsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the requested part fixed before filtering its due definitions', async () => {
    prisma.systemVocabularyEntry.findMany.mockResolvedValue([
      entry('definition-id', []),
      entry('future-definition-id', [
        { level: 2, nextReviewAt: new Date('2026-07-25T10:00:00.000Z') },
      ]),
    ]);

    await expect(service.getOxfordPart('user-id', 'A1', 2)).resolves.toEqual({
      items: [
        {
          id: 'definition-id',
          word: 'about',
          normalizedWord: 'about',
          definition: definitionData('definition-id'),
          progress: null,
        },
      ],
      limit: 20,
      offset: 20,
    });

    const calls = prisma.systemVocabularyEntry.findMany.mock
      .calls as unknown as unknown[][];
    const query = calls[0]?.[0] as {
      skip: number;
      take: number;
      where: { band: string; source: unknown };
    };

    expect(query.skip).toBe(20);
    expect(query.take).toBe(20);
    expect(query.where.band).toBe('A1');
    expect(query.where.source).toEqual({
      in: ['oxford_3000', 'oxford_5000'],
    });
  });

  it.each([
    [OxfordReviewRating.HARD, 2, '2026-07-24T18:00:00.000Z'],
    [OxfordReviewRating.GOOD, 2, '2026-07-25T10:00:00.000Z'],
    [OxfordReviewRating.EASY, 3, '2026-07-27T10:00:00.000Z'],
    [OxfordReviewRating.EASY, 4, '2126-07-24T10:00:00.000Z'],
  ])(
    'stores %s progress for one definition',
    async (rating, expectedLevel, expectedNextReviewAt) => {
      prisma.systemVocabularyEntry.findMany.mockResolvedValue([
        { id: 'definition-id' },
      ]);
      prisma.userDefinitionProgress.findUnique.mockResolvedValue({
        level:
          rating === OxfordReviewRating.EASY && expectedLevel === 4 ? 3 : 2,
      });
      prisma.userDefinitionProgress.upsert.mockResolvedValue({
        level: expectedLevel,
        nextReviewAt: new Date(expectedNextReviewAt),
      });

      await service.gradeOxfordDefinition(
        'user-id',
        'A1',
        1,
        'definition-id',
        rating,
      );

      const calls = prisma.userDefinitionProgress.upsert.mock
        .calls as unknown as unknown[][];
      const input = calls[0]?.[0] as {
        create: {
          systemEntryId: string;
          level: number;
          nextReviewAt: Date;
          userId: string;
        };
      };

      expect(input.create).toMatchObject({
        userId: 'user-id',
        systemEntryId: 'definition-id',
        level: expectedLevel,
        nextReviewAt: new Date(expectedNextReviewAt),
      });
    },
  );

  it('does not grade a definition outside the requested Oxford part', async () => {
    prisma.systemVocabularyEntry.findMany.mockResolvedValue([
      { id: 'another-definition-id' },
    ]);

    await expect(
      service.gradeOxfordDefinition(
        'user-id',
        'A1',
        1,
        'definition-id',
        OxfordReviewRating.GOOD,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.userDefinitionProgress.upsert).not.toHaveBeenCalled();
  });
});

function entry(
  id: string,
  progress: Array<{ level: number; nextReviewAt: Date }>,
) {
  return {
    ...definitionData(id),
    word: 'about',
    normalizedWord: 'about',
    sortOrder: 1,
    progress,
  };
}

function definitionData(id: string) {
  return {
    id,
    type: 'preposition',
    meaningVi: 'về',
    definition: null,
    example: null,
    exampleVi: null,
    ipaUk: null,
    ipaUs: null,
    band: 'A1',
    source: 'oxford_3000',
  };
}
