import {
  parseApprovedDictationVideo,
  parseDictationCatalog,
} from './parse-approved-dictation-catalog';

describe('Dictation catalog parsing', () => {
  it('parses a versioned catalog and approved video', () => {
    expect(
      parseDictationCatalog({
        version: 1,
        videos: [
          { id: 'video-1', path: 'videos/video-1.json', segmentCount: 1 },
        ],
      }),
    ).toEqual([
      { id: 'video-1', path: 'videos/video-1.json', segmentCount: 1 },
    ]);
    expect(
      parseApprovedDictationVideo({
        version: 1,
        status: 'approved',
        segments: [{ id: 's001', text: 'Hello world' }],
      }),
    ).toEqual([{ id: 's001', text: 'Hello world' }]);
  });

  it('rejects duplicate identifiers and unpublished videos', () => {
    expect(() => parseDictationCatalog(null)).toThrow(
      'Invalid Dictation catalog.',
    );
    expect(() =>
      parseDictationCatalog({
        version: 1,
        videos: [{ id: 'video-1', path: 'a.json', segmentCount: 0 }],
      }),
    ).toThrow('Invalid Dictation catalog.');
    expect(() => parseDictationCatalog({ version: 1, videos: [null] })).toThrow(
      'Invalid Dictation catalog.',
    );
    expect(() =>
      parseDictationCatalog({
        version: 1,
        videos: [
          { id: 'video-1', path: 'a.json', segmentCount: 1 },
          { id: 'video-1', path: 'b.json', segmentCount: 1 },
        ],
      }),
    ).toThrow('video IDs must be unique');
    expect(() =>
      parseApprovedDictationVideo({
        version: 1,
        status: 'draft',
        segments: [],
      }),
    ).toThrow('Invalid Dictation video.');
    expect(() =>
      parseApprovedDictationVideo({
        version: 1,
        status: 'approved',
        segments: [
          { id: 's001', text: 'Hello' },
          { id: 's001', text: 'Again' },
        ],
      }),
    ).toThrow('segment IDs must be unique');
    expect(() =>
      parseApprovedDictationVideo({
        version: 1,
        status: 'approved',
        segments: [{ id: '', text: 'Hello' }],
      }),
    ).toThrow('Invalid Dictation video.');
    expect(() =>
      parseApprovedDictationVideo({
        version: 1,
        status: 'approved',
        segments: [null],
      }),
    ).toThrow('Invalid Dictation video.');
  });
});
