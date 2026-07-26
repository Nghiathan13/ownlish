import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import {
  isBoolean,
  isNullableString,
  isNumber,
  isRecord,
  isString,
} from "@/shared/lib/parse";

export type ReviewRating = "FORGET" | "HARD" | "GOOD" | "EASY" | "MASTER";

export type UserVocabularyEntry = {
  id: string;
  userId: string;
  collectionId: string;
  systemEntryId: string | null;
  word: string;
  normalizedWord: string;
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
};

// Collection-table view model. The server remains flat: one entry is rendered as one row.
export type VocabWordDefinition = UserVocabularyEntry;

export type VocabWord = {
  id: string;
  userId: string;
  word: string;
  normalizedWord: string;
  definitions: [VocabWordDefinition];
};

export type VocabWordListResponse = {
  items: VocabWord[];
  meta: ListMeta;
};

export type VocabReviewListResponse = {
  items: UserVocabularyEntry[];
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
  levels: Array<{ level: number; count: number }>;
};

export type CreateVocabWordInput = {
  collectionId: string;
  band?: string;
  definition?: string;
  example?: string;
  exampleVi?: string;
  ipaUk?: string;
  ipaUs?: string;
  level?: number;
  meaningVi?: string;
  type?: string;
  word: string;
  wrongCount?: number;
};

export type UpdateVocabWordInput = Partial<Omit<CreateVocabWordInput, "collectionId">>;

export type UpdateVocabReviewInput = { rating: ReviewRating };

export type DeleteVocabEntryResult = { deletedEntryId: string };

type ListVocabWordsParams = {
  collectionId: string;
  limit?: number;
  offset?: number;
  search?: string;
  signal?: AbortSignal;
};

type VocabStatsParams = { collectionId: string; signal?: AbortSignal };

function parseVocabularyEntry(body: unknown): UserVocabularyEntry {
  if (!isRecord(body)) invalidApiResponse();

  const {
    id,
    userId,
    collectionId,
    systemEntryId,
    word,
    normalizedWord,
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
  } = body;

  if (
    !isString(id) ||
    !isString(userId) ||
    !isString(collectionId) ||
    !isNullableString(systemEntryId) ||
    !isString(word) ||
    !isString(normalizedWord) ||
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
    !isString(updatedAt)
  ) {
    invalidApiResponse();
  }

  return {
    id,
    userId,
    collectionId,
    systemEntryId,
    word,
    normalizedWord,
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
  };
}

function toVocabWord(entry: UserVocabularyEntry): VocabWord {
  return {
    id: entry.id,
    userId: entry.userId,
    word: entry.word,
    normalizedWord: entry.normalizedWord,
    definitions: [entry],
  };
}

function parseListMeta(body: unknown): ListMeta {
  if (!isRecord(body)) invalidApiResponse();
  const { limit, offset, total, hasMore } = body;

  if (!isNumber(limit) || !isNumber(offset) || !isNumber(total) || !isBoolean(hasMore)) {
    invalidApiResponse();
  }

  return { limit, offset, total, hasMore };
}

function parseVocabularyListResponse(body: unknown): VocabWordListResponse {
  if (!isRecord(body) || !Array.isArray(body.items)) invalidApiResponse();

  return {
    items: body.items.map((item) => toVocabWord(parseVocabularyEntry(item))),
    meta: parseListMeta(body.meta),
  };
}

function parseReviewListResponse(body: unknown): VocabReviewListResponse {
  if (!isRecord(body) || !Array.isArray(body.items)) invalidApiResponse();

  return { items: body.items.map(parseVocabularyEntry), meta: parseListMeta(body.meta) };
}

function parseVocabStats(body: unknown): VocabStats {
  if (!isRecord(body) || !Array.isArray(body.levels)) invalidApiResponse();
  const { total, due, mastered, highWrongCount, levels } = body;

  if (!isNumber(total) || !isNumber(due) || !isNumber(mastered) || !isNumber(highWrongCount)) {
    invalidApiResponse();
  }

  return {
    total,
    due,
    mastered,
    highWrongCount,
    levels: levels.map((levelStat) => {
      if (!isRecord(levelStat) || !isNumber(levelStat.level) || !isNumber(levelStat.count)) {
        invalidApiResponse();
      }

      return { level: levelStat.level, count: levelStat.count };
    }),
  };
}

function parseDeleteVocabEntryResult(body: unknown): DeleteVocabEntryResult {
  if (!isRecord(body) || !isString(body.deletedEntryId)) invalidApiResponse();

  return { deletedEntryId: body.deletedEntryId };
}

function buildVocabQuery(params: ListVocabWordsParams) {
  const searchParams = new URLSearchParams({ collectionId: params.collectionId });
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset));
  if (params.search) searchParams.set("search", params.search);

  return `?${searchParams.toString()}`;
}

export function listVocabWords(token: string, params: ListVocabWordsParams) {
  return apiRequest(`/vocab${buildVocabQuery(params)}`, {
    signal: params.signal,
    token,
  }).then(parseVocabularyListResponse);
}

export function getVocabStats(token: string, params: VocabStatsParams) {
  const searchParams = new URLSearchParams({ collectionId: params.collectionId });

  return apiRequest(`/vocab/stats?${searchParams.toString()}`, {
    signal: params.signal,
    token,
  }).then(parseVocabStats);
}

type ListDueReviewWordsParams = {
  collectionId: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

export function listDueReviewWords(token: string, params: ListDueReviewWordsParams) {
  const searchParams = new URLSearchParams({ collectionId: params.collectionId });
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset));

  return apiRequest(`/vocab/review/due?${searchParams.toString()}`, {
    signal: params.signal,
    token,
  }).then(parseReviewListResponse);
}

export function createVocabWord(token: string, input: CreateVocabWordInput) {
  return apiRequest("/vocab", { method: "POST", token, body: JSON.stringify(input) }).then(
    (body) => toVocabWord(parseVocabularyEntry(body)),
  );
}

export function updateVocabReview(token: string, id: string, input: UpdateVocabReviewInput) {
  return apiRequest(`/vocab/${id}/review`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  }).then(parseVocabularyEntry);
}

export function deleteVocabEntry(token: string, id: string) {
  return apiRequest(`/vocab/${id}`, { method: "DELETE", token }).then(
    parseDeleteVocabEntryResult,
  );
}

export function updateVocabWord(token: string, id: string, input: UpdateVocabWordInput) {
  return apiRequest(`/vocab/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  }).then((body) => toVocabWord(parseVocabularyEntry(body)));
}
