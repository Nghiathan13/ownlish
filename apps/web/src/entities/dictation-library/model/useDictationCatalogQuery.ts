"use client";

import { useQuery } from "@tanstack/react-query";
import { getDictationCatalog } from "../api/catalog";
import { getDictationCatalogQueryKey } from "./queries";

export function useDictationCatalogQuery(catalogPath: string | null) {
  return useQuery({
    queryKey: getDictationCatalogQueryKey(catalogPath),
    queryFn: ({ signal }) => getDictationCatalog(catalogPath!, { signal }),
    enabled: Boolean(catalogPath),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
