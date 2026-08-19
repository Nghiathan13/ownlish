export const OXFORD_BANDS = ["A1", "A2", "B1", "B2", "C1"] as const;
export const OXFORD_GROUP_SIZE = 20;
export const DEFAULT_OXFORD_BAND: OxfordBand = OXFORD_BANDS[0];
export const OXFORD_COLLECTIONS_PATH = "/collections/oxford";

export type OxfordBand = (typeof OXFORD_BANDS)[number];

export function parseOxfordBand(value: string | null): OxfordBand | null {
  return OXFORD_BANDS.find((band) => band === value) ?? null;
}

export function formatOxfordPartSegment(group: number) {
  return `part-${group}`;
}

export function parseOxfordGroup(value: string | null) {
  if (!value) {
    return null;
  }

  const partMatch = /^part-(\d+)$/i.exec(value);
  if (partMatch) {
    const group = Number(partMatch[1]);
    return Number.isSafeInteger(group) && group > 0 ? group : null;
  }

  // Legacy numeric path segment: /oxford/A1/2
  if (/^\d+$/.test(value)) {
    const group = Number(value);
    return Number.isSafeInteger(group) && group > 0 ? group : null;
  }

  return null;
}

export function parseOxfordGroupParam(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const group = Number(value);
  return Number.isSafeInteger(group) && group > 0 ? group : null;
}

export function getOxfordPath(band: OxfordBand, group?: number) {
  const params = new URLSearchParams({ band });
  if (group) {
    params.set("group", String(group));
  }

  return `${OXFORD_COLLECTIONS_PATH}?${params.toString()}`;
}

export function getOxfordPathRedirectTarget(searchParams: {
  get: (key: string) => string | null;
}) {
  const bandParam = searchParams.get("band");
  const groupParam = searchParams.get("group");
  const band = parseOxfordBand(bandParam);
  const group = parseOxfordGroupParam(groupParam);

  if (band == null) {
    return getOxfordPath(DEFAULT_OXFORD_BAND, group ?? undefined);
  }

  if (groupParam != null && group == null) {
    return getOxfordPath(band);
  }

  if (group != null && groupParam !== String(group)) {
    return getOxfordPath(band, group);
  }

  return null;
}

export function getOxfordLegacyPathRedirect(band: string, part?: string) {
  const resolvedBand = parseOxfordBand(band) ?? DEFAULT_OXFORD_BAND;
  const group = part == null ? undefined : (parseOxfordGroup(part) ?? undefined);

  return getOxfordPath(resolvedBand, group);
}

export function getOxfordGroupRange(group: number, totalWords: number) {
  const start = (group - 1) * OXFORD_GROUP_SIZE;
  const end = Math.min(start + OXFORD_GROUP_SIZE, totalWords);

  return {
    end,
    label: `${start + 1}–${end}`,
    offset: start,
    wordCount: Math.max(0, end - start),
  };
}
