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

export type CatalogWordsPage = {
  items: CatalogWord[];
  total: number;
  offset: number;
  limit: number;
};

export type OxfordCollectionMeta = {
  band: string;
  itemCount: number;
  parts: OxfordPartProgress[];
};

export type OxfordPartProgress = {
  part: number;
  itemCount: number;
  masteredCount: number;
  learningCount: number;
  newCount: number;
};

export type OxfordPart = {
  items: CatalogWord[];
  offset: number;
  limit: number;
};

export type ImportCollectionInput = {
  catalogDefinitionIds?: string[];
  limit?: number;
  offset?: number;
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

export type UpdateCollectionInput = {
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

function parseCatalogWordsPage(body: unknown): CatalogWordsPage {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    invalidApiResponse();
  }

  const { items, total, offset, limit } = body;

  if (!isNumber(total) || !isNumber(offset) || !isNumber(limit)) {
    invalidApiResponse();
  }

  return {
    items: items.map(parseCatalogWord),
    total,
    offset,
    limit,
  };
}

function parseOxfordCollectionMeta(body: unknown): OxfordCollectionMeta {
  if (!isRecord(body)) invalidApiResponse();

  const { band, itemCount, parts } = body;

  if (!isString(band) || !isNumber(itemCount) || !Array.isArray(parts)) {
    invalidApiResponse();
  }

  return {
    band,
    itemCount,
    parts: parts.map((part) => {
      if (
        !isRecord(part) ||
        !isNumber(part.part) ||
        !isNumber(part.itemCount) ||
        !isNumber(part.masteredCount) ||
        !isNumber(part.learningCount) ||
        !isNumber(part.newCount)
      ) {
        invalidApiResponse();
      }

      return part as OxfordPartProgress;
    }),
  };
}

function parseOxfordPart(body: unknown): OxfordPart {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    invalidApiResponse();
  }

  const { items, offset, limit } = body;

  if (!isNumber(offset) || !isNumber(limit)) {
    invalidApiResponse();
  }

  return {
    items: items.map(parseCatalogWord),
    offset,
    limit,
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

export function getCollectionCatalogWords(
  token: string,
  id: string,
  input: { offset: number; limit: number },
  options: { signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({
    limit: String(input.limit),
    offset: String(input.offset),
  });

  return apiRequest(`/collections/${id}/catalog-words?${params}`, {
    signal: options.signal,
    token,
  }).then(parseCatalogWordsPage);
}

export function getOxfordCollectionMeta(
  token: string,
  band: string,
  options: { signal?: AbortSignal } = {},
) {
  return apiRequest(`/collections/oxford/${band}/meta`, {
    signal: options.signal,
    token,
  }).then(parseOxfordCollectionMeta);
}

export function getOxfordPart(
  token: string,
  band: string,
  part: number,
  options: { signal?: AbortSignal } = {},
) {
  return apiRequest(`/collections/oxford/${band}/parts/${part}`, {
    signal: options.signal,
    token,
  }).then(parseOxfordPart);
}

export function importOxfordPart(
  token: string,
  band: string,
  part: number,
  catalogDefinitionIds: string[],
  options: { targetCollectionId?: string } = {},
) {
  const body: {
    catalogDefinitionIds: string[];
    targetCollectionId?: string;
  } = { catalogDefinitionIds };

  if (options.targetCollectionId) {
    body.targetCollectionId = options.targetCollectionId;
  }

  return apiRequest(`/collections/oxford/${band}/parts/${part}/import`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  }).then(parseImportCollectionResult);
}

export function createCollection(token: string, input: CreateCollectionInput) {
  return apiRequest("/collections", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  }).then(parseCollectionSummary);
}

export function updateCollection(
  token: string,
  id: string,
  input: UpdateCollectionInput,
) {
  return apiRequest(`/collections/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  }).then(parseCollectionSummary);
}

export function deleteCollection(token: string, id: string) {
  return apiRequest(`/collections/${id}`, {
    method: "DELETE",
    token,
  });
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
