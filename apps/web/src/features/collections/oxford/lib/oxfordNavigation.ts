export const OXFORD_BANDS = ["A1", "A2", "B1", "B2", "C1"] as const;
export const OXFORD_GROUP_SIZE = 20;

export type OxfordBand = (typeof OXFORD_BANDS)[number];

export function parseOxfordBand(value: string | null): OxfordBand | null {
  return OXFORD_BANDS.find((band) => band === value) ?? null;
}

export function parseOxfordGroup(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const group = Number(value);

  return Number.isSafeInteger(group) && group > 0 ? group : null;
}

export function getOxfordPath(band: OxfordBand, group?: number) {
  const params = new URLSearchParams({ band, tab: "oxford" });

  if (group) {
    params.set("group", String(group));
  }

  return `/collections?${params}`;
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
