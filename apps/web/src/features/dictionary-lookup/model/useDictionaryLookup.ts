"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicDictionaryEntry } from "@/entities/dictionary";
import { DICTIONARY_ROOT } from "@/shared/config";

export function useDictionaryLookup(word: string | null) {
  return useQuery({
    queryKey: ["public-dictionary-entry", word] as const,
    queryFn: ({ signal }) => getPublicDictionaryEntry(word!, { signal }),
    enabled: word !== null && Boolean(DICTIONARY_ROOT),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
