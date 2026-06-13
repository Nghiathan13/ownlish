import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import {
  isBoolean,
  isNullableString,
  isNumber,
  isRecord,
  isString,
} from "@/shared/lib/parse";

export type VocabWordDefinition = {
  id: string;
  vocabWordId: string;
  sourceDefinitionId: number | null;
  sourceWordId: number | null;
  type: string | null;
  meaningVi: string | null;
  definition: string | null;
  example: string | null;
  exampleVi: string | null;
  ipaUk: string | null;
  ipaUs: string | null;
  band: string | null;
  source: string;
  level: number;
  wrongCount: number;
  lastReview: string | null;
  nextReview: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type VocabWord = {
  id: string;
  userId: string;
  word: string;
  normalizedWord: string;
  definitions: VocabWordDefinition[];
};

export type VocabReviewItem = VocabWordDefinition & {
  vocabWord: Omit<VocabWord, "definitions">;
};

export type VocabWordListResponse = {
  items: VocabWord[];
  meta: ListMeta;
};

export type VocabReviewListResponse = {
  items: VocabReviewItem[];
  meta: ListMeta;
};

type ListMeta = {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
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

function parseVocabWordDefinition(body: unknown): VocabWordDefinition {
  if (!isRecord(body)) invalidApiResponse();

  const {
    id,
    vocabWordId,
    sourceDefinitionId,
    sourceWordId,
    type,
    meaningVi,
    definition,
    example,
    exampleVi,
    ipaUk,
    ipaUs,
    band,
    source,
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
    !isString(vocabWordId) ||
    !(sourceDefinitionId === null || isNumber(sourceDefinitionId)) ||
    !(sourceWordId === null || isNumber(sourceWordId)) ||
    !isNullableString(type) ||
    !isNullableString(meaningVi) ||
    !isNullableString(definition) ||
    !isNullableString(example) ||
    !isNullableString(exampleVi) ||
    !isNullableString(ipaUk) ||
    !isNullableString(ipaUs) ||
    !isNullableString(band) ||
    !isString(source) ||
    !isNumber(level) ||
    !isNumber(wrongCount) ||
    !isNullableString(lastReview) ||
    !isNullableString(nextReview) ||
    !isString(createdAt) ||
    !isString(updatedAt) ||
    !isNullableString(deletedAt)
  ) {
    invalidApiResponse();
  }

  return {
    id,
    vocabWordId,
    sourceDefinitionId,
    sourceWordId,
    type,
    meaningVi,
    definition,
    example,
    exampleVi,
    ipaUk,
    ipaUs,
    band,
    source,
    level,
    wrongCount,
    lastReview,
    nextReview,
    createdAt,
    updatedAt,
    deletedAt,
  };
}

function parseVocabWordSummary(body: unknown): Omit<VocabWord, "definitions"> {
  if (!isRecord(body)) invalidApiResponse();

  const { id, userId, word, normalizedWord } = body;

  if (
    !isString(id) ||
    !isString(userId) ||
    !isString(word) ||
    !isString(normalizedWord)
  ) {
    invalidApiResponse();
  }

  return {
    id,
    userId,
    word,
    normalizedWord,
  };
}

function parseVocabWord(body: unknown): VocabWord {
  if (!isRecord(body)) invalidApiResponse();

  const summary = parseVocabWordSummary(body);
  const { definitions } = body;

  return {
    ...summary,
    definitions: Array.isArray(definitions)
      ? definitions.map(parseVocabWordDefinition)
      : [],
  };
}

function parseVocabReviewItem(body: unknown): VocabReviewItem {
  if (!isRecord(body)) invalidApiResponse();

  const { vocabWord } = body;

  return {
    ...parseVocabWordDefinition(body),
    vocabWord: parseVocabWordSummary(vocabWord),
  };
}

function parseListMeta(body: unknown): ListMeta {
  if (!isRecord(body)) invalidApiResponse();

  const { limit, offset, total, hasMore } = body;

  if (
    !isNumber(limit) ||
    !isNumber(offset) ||
    !isNumber(total) ||
    !isBoolean(hasMore)
  ) {
    invalidApiResponse();
  }

  return {
    limit,
    offset,
    total,
    hasMore,
  };
}

function parseVocabWordListResponse(body: unknown): VocabWordListResponse {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    invalidApiResponse();
  }

  return {
    items: body.items.map(parseVocabWord),
    meta: parseListMeta(body.meta),
  };
}

function parseVocabReviewListResponse(body: unknown): VocabReviewListResponse {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    invalidApiResponse();
  }

  return {
    items: body.items.map(parseVocabReviewItem),
    meta: parseListMeta(body.meta),
  };
}

function parseVocabStats(body: unknown): VocabStats {
  if (!isRecord(body) || !Array.isArray(body.levels)) {
    invalidApiResponse();
  }

  const { total, due, mastered, highWrongCount, levels } = body;

  if (
    !isNumber(total) ||
    !isNumber(due) ||
    !isNumber(mastered) ||
    !isNumber(highWrongCount)
  ) {
    invalidApiResponse();
  }

  return {
    total,
    due,
    mastered,
    highWrongCount,
    levels: levels.map((levelStat) => {
      if (!isRecord(levelStat)) invalidApiResponse();

      const { level, count } = levelStat;

      if (!isNumber(level) || !isNumber(count)) invalidApiResponse();

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
  }).then(parseVocabReviewListResponse);
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
  }).then(parseVocabReviewItem);
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
