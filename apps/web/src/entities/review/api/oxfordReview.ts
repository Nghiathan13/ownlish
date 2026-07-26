import type { CatalogDefinition } from "@/entities/collection/api/collections";
import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import {
  isNullableString,
  isNumber,
  isRecord,
  isString,
} from "@/shared/lib/parse";

export type OxfordReviewRating = "FORGET" | "HARD" | "GOOD" | "EASY";

export type OxfordWordProgress = {
  level: number;
  wrongCount: number;
  lastReviewAt: string | null;
  nextReviewAt: string | null;
};

export type OxfordReviewItem = {
  definition: CatalogDefinition;
  id: string;
  word: string;
  normalizedWord: string;
  progress: OxfordWordProgress | null;
};

export type OxfordPartReview = {
  items: OxfordReviewItem[];
  offset: number;
  limit: number;
};

function parseCatalogDefinition(body: unknown): CatalogDefinition {
  if (!isRecord(body)) invalidApiResponse();

  const {
    id,
    type,
    meaningVi,
    definition,
    example,
    exampleVi,
    ipaUk,
    ipaUs,
    band,
    source,
  } = body;

  if (
    !isString(id) ||
    !isString(type) ||
    !isNullableString(meaningVi) ||
    !isNullableString(definition) ||
    !isNullableString(example) ||
    !isNullableString(exampleVi) ||
    !isNullableString(ipaUk) ||
    !isNullableString(ipaUs) ||
    !isNullableString(band) ||
    !isString(source)
  ) {
    invalidApiResponse();
  }

  return {
    id,
    type,
    meaningVi,
    definition,
    example,
    exampleVi,
    ipaUk,
    ipaUs,
    band,
    source,
  };
}

function parseOxfordWordProgress(body: unknown): OxfordWordProgress | null {
  if (body === null) return null;
  if (
    !isRecord(body) ||
    !isNumber(body.level) ||
    !isNumber(body.wrongCount) ||
    !isNullableString(body.lastReviewAt) ||
    !isNullableString(body.nextReviewAt)
  ) {
    invalidApiResponse();
  }

  return {
    level: body.level,
    wrongCount: body.wrongCount,
    lastReviewAt: body.lastReviewAt,
    nextReviewAt: body.nextReviewAt,
  };
}

function parseOxfordReviewItem(body: unknown): OxfordReviewItem {
  if (!isRecord(body)) {
    invalidApiResponse();
  }

  const { id, word, normalizedWord, definition, progress } = body;
  if (!isString(id) || !isString(word) || !isString(normalizedWord)) {
    invalidApiResponse();
  }

  return {
    definition: parseCatalogDefinition(definition),
    id,
    word,
    normalizedWord,
    progress: parseOxfordWordProgress(progress),
  };
}

function parseOxfordPartReview(body: unknown): OxfordPartReview {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    invalidApiResponse();
  }

  const { items, offset, limit } = body;
  if (!isNumber(offset) || !isNumber(limit)) {
    invalidApiResponse();
  }

  return {
    items: items.map(parseOxfordReviewItem),
    offset,
    limit,
  };
}

function parseOxfordWordProgressResponse(body: unknown): OxfordWordProgress {
  const progress = parseOxfordWordProgress(body);
  if (!progress) invalidApiResponse();
  return progress;
}

export function getOxfordPartReview(
  token: string,
  band: string,
  part: number,
  options: { signal?: AbortSignal } = {},
) {
  return apiRequest(`/reviews/oxford/${band}/parts/${part}`, {
    signal: options.signal,
    token,
  }).then(parseOxfordPartReview);
}

export function gradeOxfordReviewDefinition(
  token: string,
  input: {
    band: string;
    part: number;
    definitionId: string;
    rating: OxfordReviewRating;
  },
) {
  return apiRequest(
    `/reviews/oxford/${input.band}/parts/${input.part}/definitions/${input.definitionId}/grade`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ rating: input.rating }),
    },
  ).then(parseOxfordWordProgressResponse);
}
