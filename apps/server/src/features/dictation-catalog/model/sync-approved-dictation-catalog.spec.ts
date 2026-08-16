import { syncApprovedDictationCatalog } from './sync-approved-dictation-catalog';

describe('syncApprovedDictationCatalog', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the synchronized video and segment totals', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        version: 1,
        videos: [{ id: 'video-1', path: 'video-1.json', segmentCount: 1 }],
      }),
    } as Response);
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        version: 1,
        status: 'approved',
        segments: [{ id: 's001', text: 'Hello' }],
      }),
    } as Response);
    const transaction = {
      dictationCatalogSegment: { createMany: jest.fn(), deleteMany: jest.fn() },
      dictationCatalogVideo: { deleteMany: jest.fn(), upsert: jest.fn() },
    };
    const prisma = {
      $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) =>
        callback(transaction),
    };

    await expect(
      syncApprovedDictationCatalog(
        prisma as never,
        'https://content.example/dictation',
      ),
    ).resolves.toEqual({ videoCount: 1, segmentCount: 1 });
  });
});
