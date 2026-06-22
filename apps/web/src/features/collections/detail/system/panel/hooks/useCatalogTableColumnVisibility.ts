"use client";

import { useCallback, useState } from "react";
import {
  CATALOG_COLUMN_VISIBILITY_STORAGE_KEY,
  createDefaultCatalogColumnVisibility,
  parseCatalogColumnVisibility,
  toggleCatalogColumnVisibility,
  type CatalogToggleableColumnId,
} from "@/features/collections/detail/system/panel/lib/catalogTableColumns";

function readCatalogColumnVisibilityFromStorage() {
  if (typeof window === "undefined") {
    return createDefaultCatalogColumnVisibility();
  }

  return parseCatalogColumnVisibility(
    localStorage.getItem(CATALOG_COLUMN_VISIBILITY_STORAGE_KEY),
  );
}

export function useCatalogTableColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState(
    readCatalogColumnVisibilityFromStorage,
  );

  const toggleColumn = useCallback((columnId: CatalogToggleableColumnId) => {
    setColumnVisibility((current) => {
      const next = toggleCatalogColumnVisibility(current, columnId);
      localStorage.setItem(
        CATALOG_COLUMN_VISIBILITY_STORAGE_KEY,
        JSON.stringify(next),
      );
      return next;
    });
  }, []);

  return {
    columnVisibility,
    toggleColumn,
  };
}
