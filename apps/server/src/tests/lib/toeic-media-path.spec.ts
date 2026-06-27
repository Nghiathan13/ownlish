import {
  buildAudioStoragePath,
  buildImageStoragePath,
  buildToeicEditionPrefix,
  buildToeicTestFolderPrefix,
  partMayHaveAudio,
  partMayHaveImage,
  resolveGroupStoragePaths,
} from './toeic-media-path';

describe('toeic-media-path', () => {
  it('builds edition prefixes by year', () => {
    expect(buildToeicEditionPrefix(2026)).toBe('ets26');
    expect(buildToeicEditionPrefix(2025)).toBe('ybm25');
    expect(buildToeicEditionPrefix(2019)).toBe('ets19');
  });

  it('builds test folder prefixes', () => {
    expect(buildToeicTestFolderPrefix(2026, 1)).toBe('ets26_t01');
    expect(buildToeicTestFolderPrefix(2025, 2)).toBe('ybm25_t02');
  });

  it('builds single-question audio path for part 1', () => {
    expect(buildAudioStoragePath(2026, 1, 3, 3)).toBe(
      'toeic/2026/audio/ets26_t01/ets26_t01_03.mp3',
    );
  });

  it('builds group audio path for part 3', () => {
    expect(buildAudioStoragePath(2026, 1, 32, 34)).toBe(
      'toeic/2026/audio/ets26_t01/ets26_t01_32-34.mp3',
    );
  });

  it('builds YBM 2025 image path', () => {
    expect(buildImageStoragePath(2025, 1, 6, 6)).toBe(
      'toeic/2025/image/ybm25_t01/ybm25_t01_06.png',
    );
  });

  it('detects optional part 3 images', () => {
    expect(partMayHaveImage(3, 62, 64)).toBe(true);
    expect(partMayHaveImage(3, 32, 34)).toBe(false);
  });

  it('detects listening parts that may have audio', () => {
    expect(partMayHaveAudio(1)).toBe(true);
    expect(partMayHaveAudio(4)).toBe(true);
    expect(partMayHaveAudio(5)).toBe(false);
  });

  it('resolves group storage paths', () => {
    expect(resolveGroupStoragePaths(2026, 1, 1, 1, 1)).toEqual({
      audioStoragePath: 'toeic/2026/audio/ets26_t01/ets26_t01_01.mp3',
      imageStoragePath: 'toeic/2026/image/ets26_t01/ets26_t01_01.png',
    });
  });
});
