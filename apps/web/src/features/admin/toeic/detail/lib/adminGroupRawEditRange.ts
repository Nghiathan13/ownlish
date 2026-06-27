import {
  getMaxGroupIndexForCatalog,
  type AdminToeicGroupCatalogEntry,
} from "@/features/admin/toeic/detail/lib/adminToeicGroupCatalog";

export type AdminGroupRange = {
  from: number;
  to: number;
};

export function parseGroupIndexInput(raw: string) {
  const trimmed = raw.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);

  if (value < 1) {
    return null;
  }

  if (value > 103) {
    return 103;
  }

  return value;
}

export function normalizeGroupRangeInputs(
  fromInput: string,
  toInput: string,
  catalog: AdminToeicGroupCatalogEntry[],
): AdminGroupRange | null {
  const from = parseGroupIndexInput(fromInput);
  const to = parseGroupIndexInput(toInput);
  const maxIndex = getMaxGroupIndexForCatalog(catalog);

  if (from == null || to == null) {
    return null;
  }

  if (from > to) {
    return null;
  }

  if (from > maxIndex || to > maxIndex) {
    return null;
  }

  return { from, to };
}

export function buildGroupIndexSequence(range: AdminGroupRange) {
  const indexes: number[] = [];

  for (let groupIndex = range.from; groupIndex <= range.to; groupIndex += 1) {
    indexes.push(groupIndex);
  }

  return indexes;
}
