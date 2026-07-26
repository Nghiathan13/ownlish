import { NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  const now = new Date('2026-07-24T10:00:00.000Z');
  const prisma = {
    systemVocabularyEntry: { findMany: jest.fn() },
    userSystemVocabularyProgress: { findUnique: jest.fn(), upsert: jest.fn() },
  };
  const service = new ReviewsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => jest.useRealTimers());

  it('keeps the requested part fixed before filtering due entries', async () => {
    prisma.systemVocabularyEntry.findMany.mockResolvedValue([
      entry('1', []),
      entry('2', [
        {
          level: 2,
          wrongCount: 0,
          lastReviewAt: null,
          nextReviewAt: new Date('2026-07-25T10:00:00.000Z'),
        },
      ]),
    ]);

    await expect(
      service.getOxfordPart('user-id', 'A1', 2),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ id: '1', progress: null })],
      limit: 20,
      offset: 20,
    });
    expect(prisma.systemVocabularyEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
  });

  it('does not return mastered Oxford entries to the review queue', async () => {
    prisma.systemVocabularyEntry.findMany.mockResolvedValue([
      entry('1', [
        {
          level: 7,
          wrongCount: 0,
          lastReviewAt: new Date(),
          nextReviewAt: null,
        },
      ]),
    ]);

    await expect(
      service.getOxfordPart('user-id', 'A1', 1),
    ).resolves.toMatchObject({ items: [] });
  });

  it.each([
    ['FORGET', 0, 3, '2026-07-24T11:46:40.000Z'],
    ['HARD', 2, 2, '2026-07-25T04:40:00.000Z'],
    ['GOOD', 2, 2, '2026-07-26T18:00:00.000Z'],
    ['EASY', 3, 2, '2026-07-31T10:00:00.000Z'],
    ['MASTER', 7, 2, null],
  ] as const)(
    'stores %s progress for a system entry',
    async (rating, level, wrongCount, nextReviewAt) => {
      prisma.systemVocabularyEntry.findMany.mockResolvedValue([{ id: '1' }]);
      prisma.userSystemVocabularyProgress.findUnique.mockResolvedValue({
        level: 2,
        wrongCount: 2,
      });
      prisma.userSystemVocabularyProgress.upsert.mockResolvedValue({
        level,
        wrongCount,
        nextReviewAt: nextReviewAt ? new Date(nextReviewAt) : null,
      });

      await service.gradeOxfordDefinition('user-id', 'A1', 1, '1', rating);

      const [input] = prisma.userSystemVocabularyProgress.upsert.mock
        .calls[0] as unknown as [
        {
          create: {
            userId: string;
            systemEntryId: string;
            level: number;
            wrongCount: number;
            nextReviewAt: Date | null;
          };
        },
      ];
      expect(input.create).toMatchObject({
        userId: 'user-id',
        systemEntryId: '1',
        level,
        wrongCount,
        nextReviewAt: nextReviewAt ? new Date(nextReviewAt) : null,
      });
    },
  );

  it('does not grade an entry outside the requested Oxford part', async () => {
    prisma.systemVocabularyEntry.findMany.mockResolvedValue([{ id: '2' }]);

    await expect(
      service.gradeOxfordDefinition('user-id', 'A1', 1, '1', 'GOOD'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.userSystemVocabularyProgress.upsert).not.toHaveBeenCalled();
  });
});

function entry(
  id: string,
  progress: Array<{
    level: number;
    wrongCount: number;
    lastReviewAt: Date | null;
    nextReviewAt: Date | null;
  }>,
) {
  return {
    id,
    word: 'about',
    normalizedWord: 'about',
    type: 'preposition',
    meaningVi: 'về',
    definition: null,
    example: null,
    exampleVi: null,
    ipaUk: null,
    ipaUs: null,
    band: 'A1',
    source: 'oxford_3000',
    sortOrder: 1,
    progress,
  };
}
