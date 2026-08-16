import { replaceDictationCatalogProjection } from './replace-dictation-catalog-projection';

describe('replaceDictationCatalogProjection', () => {
  it('transactionally replaces catalog rows without touching learner progress', async () => {
    const transaction = {
      dictationCatalogSegment: { createMany: jest.fn(), deleteMany: jest.fn() },
      dictationCatalogVideo: { deleteMany: jest.fn(), upsert: jest.fn() },
    };
    const prisma = {
      $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
        callback(transaction),
    };

    await replaceDictationCatalogProjection(prisma as never, [
      {
        id: 'video-1',
        segments: [
          { id: 's001', text: 'Hello world' },
          { id: 's002', text: 'Good day' },
        ],
      },
    ]);

    expect(transaction.dictationCatalogSegment.createMany).toHaveBeenCalledWith(
      {
        data: [
          { videoId: 'video-1', segmentId: 's001', transcript: 'Hello world' },
          { videoId: 'video-1', segmentId: 's002', transcript: 'Good day' },
        ],
      },
    );
  });
});
