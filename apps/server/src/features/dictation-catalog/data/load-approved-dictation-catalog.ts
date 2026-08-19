import {
  parseApprovedDictationVideo,
  parseDictationCatalog,
  parseDictationCatalogIndex,
} from '../model/parse-approved-dictation-catalog';
import type { ApprovedDictationCatalogVideo } from '../model/approved-dictation-catalog.types';

export async function loadApprovedDictationCatalog(
  root: string,
): Promise<ApprovedDictationCatalogVideo[]> {
  if (!root.trim()) {
    throw new Error('DICTATION_CATALOG_ROOT is not set.');
  }

  const rootUrl = new URL(root.endsWith('/') ? root : `${root}/`);
  const index = parseDictationCatalogIndex(
    await fetchJson(new URL('index.json', rootUrl)),
  );
  const catalog = (
    await Promise.all(
      index.map((category) =>
        fetchJson(new URL(category.path, rootUrl)).then(parseDictationCatalog),
      ),
    )
  ).flat();
  if (new Set(catalog.map((video) => video.id)).size !== catalog.length) {
    throw new Error('Invalid Dictation catalog: video IDs must be unique.');
  }
  const videos: ApprovedDictationCatalogVideo[] = [];

  for (const catalogVideo of catalog) {
    const segments = parseApprovedDictationVideo(
      await fetchJson(new URL(catalogVideo.path, rootUrl)),
    );
    if (segments.length !== catalogVideo.segmentCount) {
      throw new Error(
        `Dictation segment count does not match for ${catalogVideo.id}.`,
      );
    }
    videos.push({ id: catalogVideo.id, segments });
  }

  return videos;
}

async function fetchJson(url: URL): Promise<unknown> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Cannot load Dictation catalog from ${url.toString()}.`);
  }

  return response.json();
}
