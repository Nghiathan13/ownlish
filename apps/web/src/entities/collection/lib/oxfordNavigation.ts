export const OXFORD_BANDS = ["A1", "A2", "B1", "B2", "C1"] as const;
export const OXFORD_GROUP_SIZE = 20;

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

export function getOxfordPath(band: OxfordBand, group?: number) {
  if (group) {
    return `/collections/oxford/${band}/${formatOxfordPartSegment(group)}`;
  }

  return `/collections/oxford/${band}`;
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
