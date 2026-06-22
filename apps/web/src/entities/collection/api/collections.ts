import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import {
  isBoolean,
  isNullableString,
  isNumber,
  isRecord,
  isString,
} from "@/shared/lib/parse";

export type WordCollectionKind = "SYSTEM" | "USER";

export type CollectionSummary = {
  id: string;
  name: string;
  description: string | null;
  kind: WordCollectionKind;
  source: string | null;
  cefrLevel: string | null;
  isDefault: boolean;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CatalogDefinition = {
  id: string;
  type: string;
  meaningVi: string | null;
  definition: string | null;
  example: string | null;
  exampleVi: string | null;
  ipaUk: string | null;
  ipaUs: string | null;
  band: string | null;
  source: string;
};

export type CatalogWord = {
  id: string;
  word: string;
  normalizedWord: string;
  definitions: CatalogDefinition[];
};

export type CollectionDetail = CollectionSummary & {
  catalogWords: CatalogWord[];
};

export type ImportCollectionInput = {
  catalogDefinitionIds?: string[];
  targetCollectionId?: string;
};

export type ImportCollectionResult = {
  imported: number;
  updated: number;
  skipped: number;
};

export type CreateCollectionInput = {
  name: string;
  description?: string;
};

function parseCollectionKind(value: unknown): WordCollectionKind {
  if (value === "SYSTEM" || value === "USER") return value;

  invalidApiResponse();
}

function parseCollectionSummary(body: unknown): CollectionSummary {
  if (!isRecord(body)) invalidApiResponse();

  const {
    id,
    name,
    description,
    kind,
    source,
    cefrLevel,
    isDefault,
    isPublic,
    itemCount,
    createdAt,
    updatedAt,
  } = body;

  if (
    !isString(id) ||
    !isString(name) ||
    !isNullableString(description) ||
    !isNullableString(source) ||
    !isNullableString(cefrLevel) ||
    !isBoolean(isDefault) ||
    !isBoolean(isPublic) ||
    !isNumber(itemCount) ||
    !isString(createdAt) ||
    !isString(updatedAt)
  ) {
    invalidApiResponse();
  }

  return {
    id,
    name,
    description,
    kind: parseCollectionKind(kind),
    source,
    cefrLevel,
    isDefault,
    isPublic,
    itemCount,
    createdAt,
    updatedAt,
  };
}

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

function parseCatalogWord(body: unknown): CatalogWord {
  if (!isRecord(body) || !Array.isArray(body.definitions)) {
    invalidApiResponse();
  }

  const { id, word, normalizedWord, definitions } = body;

  if (!isString(id) || !isString(word) || !isString(normalizedWord)) {
    invalidApiResponse();
  }

  return {
    id,
    word,
    normalizedWord,
    definitions: definitions.map(parseCatalogDefinition),
  };
}

function parseCollectionDetail(body: unknown): CollectionDetail {
  const summary = parseCollectionSummary(body);

  if (!isRecord(body) || !Array.isArray(body.catalogWords)) {
    invalidApiResponse();
  }

  return {
    ...summary,
    catalogWords: body.catalogWords.map(parseCatalogWord),
  };
}

function parseImportCollectionResult(body: unknown): ImportCollectionResult {
  if (!isRecord(body)) invalidApiResponse();

  const { imported, updated, skipped } = body;

  if (
    !isNumber(imported) ||
    !(updated === undefined || isNumber(updated)) ||
    !isNumber(skipped)
  ) {
    invalidApiResponse();
  }

  return {
    imported,
    updated: updated ?? 0,
    skipped,
  };
}

export function listCollections(token: string, options: { signal?: AbortSignal } = {}) {
  return apiRequest("/collections", {
    signal: options.signal,
    token,
  }).then((body) => {
    if (!Array.isArray(body)) invalidApiResponse();

    return body.map(parseCollectionSummary);
  });
}

export function getCollection(
  token: string,
  id: string,
  options: { signal?: AbortSignal } = {},
) {
  return apiRequest(`/collections/${id}`, {
    signal: options.signal,
    token,
  }).then(parseCollectionDetail);
}

export function createCollection(token: string, input: CreateCollectionInput) {
  return apiRequest("/collections", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  }).then(parseCollectionSummary);
}

export function importCollection(
  token: string,
  id: string,
  input: ImportCollectionInput = {},
) {
  return apiRequest(`/collections/${id}/import`, {
    method: "POST",
    token,
    body: JSON.stringify(input),
  }).then(parseImportCollectionResult);
}
