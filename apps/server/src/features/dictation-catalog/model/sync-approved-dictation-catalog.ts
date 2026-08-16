import type { PrismaClient } from '@prisma/client';
import { loadApprovedDictationCatalog } from '../data/load-approved-dictation-catalog';
import { replaceDictationCatalogProjection } from '../data/replace-dictation-catalog-projection';

export async function syncApprovedDictationCatalog(
  prisma: PrismaClient,
  root: string,
) {
  const videos = await loadApprovedDictationCatalog(root);
  await replaceDictationCatalogProjection(prisma, videos);

  return {
    segmentCount: videos.reduce(
      (total, video) => total + video.segments.length,
      0,
    ),
    videoCount: videos.length,
  };
}
