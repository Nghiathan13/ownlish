import {
  CATALOG_TOGGLEABLE_COLUMNS,
  type CatalogColumnVisibility,
  type CatalogToggleableColumnId,
} from "@/features/collections/constants/catalogTableColumns";

export {
  CATALOG_COLUMN_VISIBILITY_STORAGE_KEY,
  CATALOG_TOGGLEABLE_COLUMNS,
  type CatalogColumnVisibility,
  type CatalogToggleableColumnId,
} from "@/features/collections/constants/catalogTableColumns";

export function createDefaultCatalogColumnVisibility(): CatalogColumnVisibility {
  return Object.fromEntries(
    CATALOG_TOGGLEABLE_COLUMNS.map((column) => [column.id, true]),
  ) as CatalogColumnVisibility;
}

const DEFAULT_CATALOG_COLUMN_VISIBILITY = createDefaultCatalogColumnVisibility();

function isCatalogToggleableColumnId(
  value: string,
): value is CatalogToggleableColumnId {
  return CATALOG_TOGGLEABLE_COLUMNS.some((column) => column.id === value);
}

export function parseCatalogColumnVisibility(
  raw: string | null,
): CatalogColumnVisibility {
  if (!raw) {
    return createDefaultCatalogColumnVisibility();
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return createDefaultCatalogColumnVisibility();
    }

    const next = { ...DEFAULT_CATALOG_COLUMN_VISIBILITY };

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== "boolean") {
        continue;
      }

      if (key === "ipa") {
        next.ipaUk = value;
        next.ipaUs = value;
        continue;
      }

      if (isCatalogToggleableColumnId(key)) {
        next[key] = value;
      }
    }

    return next;
  } catch {
    return createDefaultCatalogColumnVisibility();
  }
}

export function toggleCatalogColumnVisibility(
  visibility: CatalogColumnVisibility,
  columnId: CatalogToggleableColumnId,
): CatalogColumnVisibility {
  return {
    ...visibility,
    [columnId]: !visibility[columnId],
  };
}

export function isCatalogColumnVisible(
  visibility: CatalogColumnVisibility,
  columnId: CatalogToggleableColumnId,
) {
  return visibility[columnId];
}
