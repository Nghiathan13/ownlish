import { resolveToeicCatalogGroupMedia } from "@/entities/toeic-catalog/model/media";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import type { ToeicCatalogTest } from "@/entities/toeic-catalog/model/types";
import { preloadMedia } from "@/shared/lib/preloadMedia";

export function preloadCatalogGroupMedia(
  source: ToeicCatalogSource,
  groupKey: string | null | undefined,
) {
  preloadMedia(resolveToeicCatalogGroupMedia(source, groupKey));
}

export function preloadCatalogGroupImage(
  source: ToeicCatalogSource,
  groupKey: string | null | undefined,
) {
  const { imageUrl } = resolveToeicCatalogGroupMedia(source, groupKey);
  preloadMedia({ audioUrl: null, imageUrl });
}

export function getFirstTestPartGroupKey(
  test: ToeicCatalogTest,
  partNumbers: number[],
) {
  const firstPartNumber = [...partNumbers].sort((left, right) => left - right)[0];

  return test.parts.find((part) => part.number === firstPartNumber)?.firstGroupKey ?? null;
}

export function getFirstPartPracticeGroupKey(
  source: ToeicCatalogSource,
  partNumber: number | null | undefined,
) {
  return source.manifest.partPractice.find(
    (part) => part.number === partNumber,
  )?.firstGroupKey ?? null;
}

export function preloadFirstTestPartImage(
  source: ToeicCatalogSource,
  test: ToeicCatalogTest,
  partNumbers: number[],
) {
  preloadCatalogGroupImage(source, getFirstTestPartGroupKey(test, partNumbers));
}
