import { ApiError, apiRequest } from "@/shared/api/http";
import {
  isBoolean,
  isNullableString,
  isNumber,
  isRecord,
  isString,
} from "@/shared/lib/parse";

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

export type VocabStats = {
  total: number;
  due: number;
  mastered: number;
  highWrongCount: number;
  levels: Array<{
    level: number;
    count: number;
  }>;
};

export type CreateVocabWordInput = {
  band?: string;
  definition?: string;
  example?: string;
  ipa?: string;
  level?: number;
  meaningVi?: string;
  type?: string;
  word: string;
  wrongCount?: number;
};

export type UpdateVocabWordInput = Partial<CreateVocabWordInput>;

export type UpdateVocabReviewInput = {
  level: number;
  wrongCount: number;
  lastReview: string;
  nextReview: string | null;
};

type ListVocabWordsParams = {
  limit?: number;
  offset?: number;
  search?: string;
  signal?: AbortSignal;
};

function invalidResponse(): never {
  throw new ApiError("Invalid server response.", 0);
}

function parseVocabWord(body: unknown): VocabWord {
  if (!isRecord(body)) invalidResponse();

  const {
    id,
    userId,
    word,
    normalizedWord,
    ipa,
    type,
    meaningVi,
    definition,
    example,
    band,
    level,
    wrongCount,
    lastReview,
    nextReview,
    createdAt,
    updatedAt,
    deletedAt,
  } = body;

  if (
    !isString(id) ||
    !isString(userId) ||
    !isString(word) ||
    !isString(normalizedWord) ||
    !isNullableString(ipa) ||
    !isNullableString(type) ||
    !isNullableString(meaningVi) ||
    !isNullableString(definition) ||
    !isNullableString(example) ||
    !isNullableString(band) ||
    !isNumber(level) ||
    !isNumber(wrongCount) ||
    !isNullableString(lastReview) ||
    !isNullableString(nextReview) ||
    !isString(createdAt) ||
    !isString(updatedAt) ||
    !isNullableString(deletedAt)
  ) {
    invalidResponse();
  }

  return {
    id,
    userId,
    word,
    normalizedWord,
    ipa,
    type,
    meaningVi,
    definition,
    example,
    band,
    level,
    wrongCount,
    lastReview,
    nextReview,
    createdAt,
    updatedAt,
    deletedAt,
  };
}

function parseVocabWordListResponse(body: unknown): VocabWordListResponse {
  if (!isRecord(body) || !Array.isArray(body.items) || !isRecord(body.meta)) {
    invalidResponse();
  }

  const { limit, offset, total, hasMore } = body.meta;

  if (
    !isNumber(limit) ||
    !isNumber(offset) ||
    !isNumber(total) ||
    !isBoolean(hasMore)
  ) {
    invalidResponse();
  }

  return {
    items: body.items.map(parseVocabWord),
    meta: {
      limit,
      offset,
      total,
      hasMore,
    },
  };
}

function parseVocabStats(body: unknown): VocabStats {
  if (!isRecord(body) || !Array.isArray(body.levels)) {
    invalidResponse();
  }

  const { total, due, mastered, highWrongCount, levels } = body;

  if (
    !isNumber(total) ||
    !isNumber(due) ||
    !isNumber(mastered) ||
    !isNumber(highWrongCount)
  ) {
    invalidResponse();
  }

  return {
    total,
    due,
    mastered,
    highWrongCount,
    levels: levels.map((levelStat) => {
      if (!isRecord(levelStat)) invalidResponse();

      const { level, count } = levelStat;

      if (!isNumber(level) || !isNumber(count)) invalidResponse();

      return { level, count };
    }),
  };
}

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
  return apiRequest(`/vocab${buildVocabQuery(params)}`, {
    signal: params.signal,
    token,
  }).then(parseVocabWordListResponse);
}

export function getVocabStats(
  token: string,
  options: { signal?: AbortSignal } = {},
) {
  return apiRequest("/vocab/stats", {
    signal: options.signal,
    token,
  }).then(parseVocabStats);
}

export function listDueReviewWords(
  token: string,
  params: ListVocabWordsParams = {},
) {
  return apiRequest(`/vocab/review/due${buildVocabQuery(params)}`, {
    signal: params.signal,
    token,
  }).then(parseVocabWordListResponse);
}

export function createVocabWord(token: string, input: CreateVocabWordInput) {
  return apiRequest("/vocab", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  }).then(parseVocabWord);
}

export function updateVocabReview(
  token: string,
  id: string,
  input: UpdateVocabReviewInput,
) {
  return apiRequest(`/vocab/${id}/review`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  }).then(parseVocabWord);
}

export function deleteVocabWord(token: string, id: string) {
  return apiRequest(`/vocab/${id}`, {
    method: "DELETE",
    token,
  }).then(parseVocabWord);
}

export function updateVocabWord(
  token: string,
  id: string,
  input: UpdateVocabWordInput,
) {
  return apiRequest(`/vocab/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  }).then(parseVocabWord);
}
