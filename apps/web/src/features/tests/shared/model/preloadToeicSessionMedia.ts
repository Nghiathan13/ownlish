import { resolveToeicCatalogGroupMedia } from "@/entities/toeic-catalog/model/media";
import type { ToeicCatalogSource } from "@/entities/toeic-catalog/model/types";
import type { ToeicCatalogTest } from "@/entities/toeic-catalog/model/types";
import type { RuntimePartPracticeSession } from "@/entities/toeic-runtime/model/materializePartPracticeSession";
import type { RuntimeTestSession } from "@/entities/toeic-runtime/model/materializeTestSession";
import { preloadMedia } from "@/shared/lib/preloadMedia";

function resolveSessionGroupKey(
  groupKeyById: Map<number, string>,
  groups: Array<{ id: number }>,
  preferredGroupKey?: string | null,
) {
  if (preferredGroupKey && Array.from(groupKeyById.values()).includes(preferredGroupKey)) {
    return preferredGroupKey;
  }

  return groupKeyById.get(groups[0]?.id ?? 0) ?? null;
}

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

export function preloadTestSessionMedia(
  source: ToeicCatalogSource,
  session: RuntimeTestSession,
  preferredGroupKey?: string | null,
) {
  const groupKey = resolveSessionGroupKey(
    session.groupKeyById,
    session.groups,
    preferredGroupKey,
  );
  preloadCatalogGroupMedia(source, groupKey);
  return groupKey;
}

export function preloadPartPracticeSessionMedia(
  source: ToeicCatalogSource,
  session: RuntimePartPracticeSession,
  preferredGroupKey?: string | null,
) {
  const groupKey = resolveSessionGroupKey(
    session.groupKeyById,
    session.groups,
    preferredGroupKey,
  );
  preloadCatalogGroupMedia(source, groupKey);
  return groupKey;
}
