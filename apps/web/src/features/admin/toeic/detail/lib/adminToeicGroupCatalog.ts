import type {
  AdminToeicTestRawGroup,
  AdminToeicTestRawPart,
} from "@/features/admin/toeic/api/types";

export const MIN_TOEIC_GROUP_INDEX = 1;
export const MAX_TOEIC_GROUP_INDEX = 103;

export type AdminToeicGroupCatalogEntry = {
  groupIndex: number;
  partNumber: number;
  group: AdminToeicTestRawGroup;
};

export function buildAdminToeicGroupCatalog(
  parts: AdminToeicTestRawPart[],
): AdminToeicGroupCatalogEntry[] {
  const catalog: AdminToeicGroupCatalogEntry[] = [];
  const sortedParts = [...parts].sort((left, right) => left.partNumber - right.partNumber);

  for (const part of sortedParts) {
    const sortedGroups = [...part.groups].sort(
      (left, right) => left.questionStart - right.questionStart,
    );

    for (const group of sortedGroups) {
      catalog.push({
        groupIndex: catalog.length + 1,
        partNumber: part.partNumber,
        group,
      });
    }
  }

  return catalog;
}

export function findAdminGroupIndexByGroupId(
  catalog: AdminToeicGroupCatalogEntry[],
  groupId: number,
) {
  return catalog.find((entry) => entry.group.id === groupId)?.groupIndex ?? null;
}

export function getAdminToeicGroupCatalogEntry(
  catalog: AdminToeicGroupCatalogEntry[],
  groupIndex: number,
) {
  return catalog[groupIndex - 1] ?? null;
}

export function getMaxGroupIndexForCatalog(catalog: AdminToeicGroupCatalogEntry[]) {
  return Math.min(MAX_TOEIC_GROUP_INDEX, catalog.length);
}
