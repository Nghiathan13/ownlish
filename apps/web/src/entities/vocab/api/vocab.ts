import { apiRequest } from "@/shared/api/http";

export type VocabWord = {
  id: string;
  userId: string;
  word: string;
  normalizedWord: string;
  ipa: string | null;
  type: string | null;
  meaningVi: string | null;
  definition: string | null;
  example: string | null;
  band: string | null;
  level: number;
  wrongCount: number;
  lastReview: string | null;
  nextReview: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type VocabWordListResponse = {
  items: VocabWord[];
  meta: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

export type CreateVocabWordInput = {
  ipa?: string;
  meaningVi?: string;
  type?: string;
  word: string;
};

type ListVocabWordsParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

function buildVocabQuery(params: ListVocabWordsParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export function listVocabWords(
  token: string,
  params: ListVocabWordsParams = {},
) {
  return apiRequest<VocabWordListResponse>(`/vocab${buildVocabQuery(params)}`, {
    token,
  });
}

export function createVocabWord(token: string, input: CreateVocabWordInput) {
  return apiRequest<VocabWord>("/vocab", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}
