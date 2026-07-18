"use client";

import { useQuery } from "@tanstack/react-query";
import { getToeicCatalog } from "../api/catalog";
import { TOEIC_CATALOG_ROOT } from "@/shared/config/env";

export const toeicCatalogQueryKey = ["toeic-catalog"] as const;

export function useToeicCatalogQuery(enabled: boolean) {
  return useQuery({
    queryKey: toeicCatalogQueryKey,
    queryFn: getToeicCatalog,
    enabled: enabled && Boolean(TOEIC_CATALOG_ROOT),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
