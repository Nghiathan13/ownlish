import { loadApprovedDictationCatalog } from './load-approved-dictation-catalog';

const catalog = {
  version: 1,
  videos: [{ id: 'video-1', path: 'videos/video-1.json', segmentCount: 2 }],
};
const emptyCatalog = { version: 1, videos: [] };
const video = {
  version: 1,
  status: 'approved',
  segments: [
    { id: 's001', text: 'Hello world' },
    { id: 's002', text: 'Good day' },
  ],
};

function response(value: unknown, ok = true) {
  return { json: jest.fn().mockResolvedValue(value), ok } as Response;
}

describe('loadApprovedDictationCatalog', () => {
  beforeEach(() => jest.spyOn(global, 'fetch'));
  afterEach(() => jest.restoreAllMocks());

  it('loads approved videos with matching segment counts', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(response(catalog))
      .mockResolvedValueOnce(response(emptyCatalog))
      .mockResolvedValueOnce(response(video));

    await expect(
      loadApprovedDictationCatalog('https://content.example/dictation/'),
    ).resolves.toEqual([
      {
        id: 'video-1',
        segments: [
          { id: 's001', text: 'Hello world' },
          { id: 's002', text: 'Good day' },
        ],
      },
    ]);
  });

  it('rejects a missing root, failed fetch, and count mismatch', async () => {
    await expect(loadApprovedDictationCatalog('')).rejects.toThrow(
      'DICTATION_CATALOG_ROOT is not set.',
    );
    jest.mocked(fetch).mockResolvedValueOnce(response(null, false));
    await expect(
      loadApprovedDictationCatalog('https://content.example/dictation'),
    ).rejects.toThrow('Cannot load Dictation catalog');

    jest
      .mocked(fetch)
      .mockResolvedValueOnce(response(catalog))
      .mockResolvedValueOnce(response(emptyCatalog))
      .mockResolvedValueOnce(
        response({ ...video, segments: [video.segments[0]] }),
      );
    await expect(
      loadApprovedDictationCatalog('https://content.example/dictation'),
    ).rejects.toThrow('segment count does not match');
  });
});
