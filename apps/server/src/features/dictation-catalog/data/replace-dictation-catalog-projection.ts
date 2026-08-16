import type { PrismaClient } from '@prisma/client';
import type { ApprovedDictationCatalogVideo } from '../model/approved-dictation-catalog.types';

export async function replaceDictationCatalogProjection(
  prisma: PrismaClient,
  videos: ApprovedDictationCatalogVideo[],
) {
  const videoIds = videos.map((video) => video.id);

  await prisma.$transaction(async (tx) => {
    await tx.dictationCatalogSegment.deleteMany({
      where: { videoId: { in: videoIds } },
    });
    await tx.dictationCatalogVideo.deleteMany({
      where: { videoId: { notIn: videoIds } },
    });
    for (const video of videos) {
      await tx.dictationCatalogVideo.upsert({
        where: { videoId: video.id },
        create: { videoId: video.id, segmentCount: video.segments.length },
        update: { segmentCount: video.segments.length },
      });
      await tx.dictationCatalogSegment.createMany({
        data: video.segments.map((segment) => ({
          videoId: video.id,
          segmentId: segment.id,
          transcript: segment.text,
        })),
      });
    }
  });
}
