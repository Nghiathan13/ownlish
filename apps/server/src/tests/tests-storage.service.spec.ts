import { TestsStorageService } from './tests-storage.service';

describe('TestsStorageService', () => {
  const createSignedUrls = jest.fn();
  const from = jest.fn(() => ({ createSignedUrls }));
  const client = { storage: { from } };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(TestsStorageService.prototype as never, 'getClient' as never)
      .mockReturnValue(client as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('signs unique media paths in one batch request', async () => {
    createSignedUrls.mockResolvedValue({
      data: [
        { path: 'images/part-3.png', signedUrl: 'https://storage/image' },
        { path: 'audio/part-3.mp3', signedUrl: 'https://storage/audio' },
      ],
      error: null,
    });
    const service = new TestsStorageService();

    const signed = await service.createSignedUrls([
      'audio/part-3.mp3',
      null,
      'images/part-3.png',
      'audio/part-3.mp3',
    ]);

    expect(from).toHaveBeenCalledWith('toeic-media');
    expect(createSignedUrls).toHaveBeenCalledWith(
      ['audio/part-3.mp3', 'images/part-3.png'],
      900,
    );
    expect(signed.get('audio/part-3.mp3')?.url).toBe(
      'https://storage/audio',
    );
    expect(signed.get('images/part-3.png')?.url).toBe(
      'https://storage/image',
    );
  });

  it('keeps every path unresolved when the batch request fails', async () => {
    createSignedUrls.mockResolvedValue({
      data: null,
      error: { message: 'Storage unavailable' },
    });
    const service = new TestsStorageService();

    const signed = await service.createSignedUrls([
      'audio/part-3.mp3',
      'images/part-3.png',
    ]);

    expect(signed).toEqual(
      new Map([
        ['audio/part-3.mp3', null],
        ['images/part-3.png', null],
      ]),
    );
  });

  it('splits more than 1,000 paths into concurrent batch requests', async () => {
    createSignedUrls.mockImplementation((paths: string[]) =>
      Promise.resolve({
        data: paths.map((path) => ({
          path,
          signedUrl: `https://storage/${path}`,
        })),
        error: null,
      }),
    );
    const service = new TestsStorageService();
    const paths = Array.from(
      { length: 1001 },
      (_, index) => `audio/part-3-${index}.mp3`,
    );

    const signed = await service.createSignedUrls(paths);

    expect(createSignedUrls).toHaveBeenCalledTimes(2);
    expect(createSignedUrls.mock.calls[0]?.[0]).toHaveLength(1000);
    expect(createSignedUrls.mock.calls[1]?.[0]).toEqual([
      'audio/part-3-1000.mp3',
    ]);
    expect(signed.get('audio/part-3-1000.mp3')?.url).toBe(
      'https://storage/audio/part-3-1000.mp3',
    );
  });
});
