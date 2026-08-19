"use client";

import { useQuery } from "@tanstack/react-query";
import { getDictationCatalogIndex } from "../api/catalog";
import { getDictationCatalogIndexQueryKey } from "./queries";

export function useDictationCatalogIndexQuery() {
  return useQuery({
    queryKey: getDictationCatalogIndexQueryKey(),
    queryFn: ({ signal }) => getDictationCatalogIndex({ signal }),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
