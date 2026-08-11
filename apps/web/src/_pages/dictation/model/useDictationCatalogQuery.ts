"use client";

import { useQuery } from "@tanstack/react-query";
import { getDictationCatalog } from "../api/catalog";
import { getDictationCatalogQueryKey } from "./queries";

export function useDictationCatalogQuery() {
  return useQuery({
    queryKey: getDictationCatalogQueryKey(),
    queryFn: ({ signal }) => getDictationCatalog({ signal }),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
