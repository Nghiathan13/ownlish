import type {
  DictationCatalogSegment,
  DictationCatalogVideo,
} from './approved-dictation-catalog.types';

export type DictationCatalogIndexCategory = {
  id: string;
  label: string;
  path: string;
};

export function parseDictationCatalogIndex(
  value: unknown,
): DictationCatalogIndexCategory[] {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.categories)
  ) {
    throw new Error('Invalid Dictation catalog index.');
  }

  const categories = value.categories.map(
    (item): DictationCatalogIndexCategory => {
      if (!isRecord(item)) {
        throw new Error('Invalid Dictation catalog index.');
      }

      return {
        id: requireNonEmptyString(item.id, 'Invalid Dictation catalog index.'),
        label: requireNonEmptyString(
          item.label,
          'Invalid Dictation catalog index.',
        ),
        path: requireNonEmptyString(
          item.path,
          'Invalid Dictation catalog index.',
        ),
      };
    },
  );
  assertUniqueIds(
    categories,
    'Invalid Dictation catalog index: category IDs must be unique.',
  );

  return categories;
}

export function parseDictationCatalog(value: unknown): DictationCatalogVideo[] {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.videos)) {
    throw new Error('Invalid Dictation catalog.');
  }

  const videos = value.videos.map((item): DictationCatalogVideo => {
    if (!isRecord(item)) {
      throw new Error('Invalid Dictation catalog.');
    }

    const segmentCount = item.segmentCount;
    if (
      typeof segmentCount !== 'number' ||
      !Number.isInteger(segmentCount) ||
      segmentCount < 1
    ) {
      throw new Error('Invalid Dictation catalog.');
    }

    return {
      id: requireNonEmptyString(item.id, 'Invalid Dictation catalog.'),
      path: requireNonEmptyString(item.path, 'Invalid Dictation catalog.'),
      segmentCount,
    };
  });
  assertUniqueIds(
    videos,
    'Invalid Dictation catalog: video IDs must be unique.',
  );

  return videos;
}

export function parseApprovedDictationVideo(
  value: unknown,
): DictationCatalogSegment[] {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    value.status !== 'approved' ||
    !Array.isArray(value.segments)
  ) {
    throw new Error('Invalid Dictation video.');
  }

  const segments = value.segments.map((item): DictationCatalogSegment => {
    if (!isRecord(item)) {
      throw new Error('Invalid Dictation video.');
    }

    return {
      id: requireNonEmptyString(item.id, 'Invalid Dictation video.'),
      text: requireNonEmptyString(item.text, 'Invalid Dictation video.'),
    };
  });
  assertUniqueIds(
    segments,
    'Invalid Dictation video: segment IDs must be unique.',
  );

  return segments;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requireNonEmptyString(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(message);
  }

  return value;
}

function assertUniqueIds(values: Array<{ id: string }>, message: string) {
  if (new Set(values.map((value) => value.id)).size !== values.length) {
    throw new Error(message);
  }
}
