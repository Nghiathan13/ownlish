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
});
