import { TOEIC_CATALOG_ROOT } from "@/shared/config/env";
import type {
  ToeicCatalogDocument,
  ToeicCatalogManifest,
  ToeicCatalogSource,
} from "../model/types";

function getCatalogRootUrl() {
  if (!TOEIC_CATALOG_ROOT) {
    throw new Error("TOEIC catalog is not configured.");
  }

  return new URL(
    TOEIC_CATALOG_ROOT.endsWith("/")
      ? TOEIC_CATALOG_ROOT
      : `${TOEIC_CATALOG_ROOT}/`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseManifest(value: unknown): ToeicCatalogManifest {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.tests) ||
    !Array.isArray(value.partPractice) ||
    !isRecord(value.mediaByGroupId)
  ) {
    throw new Error("Invalid TOEIC catalog.");
  }

  return value as ToeicCatalogManifest;
}

function parseDocument(value: unknown): ToeicCatalogDocument {
  if (
    !isRecord(value) ||
    (!Array.isArray(value.items) && !Array.isArray(value.groups))
  ) {
    throw new Error("Invalid TOEIC part document.");
  }

  return value;
}

async function fetchJson(url: URL, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error("Cannot load TOEIC catalog.");
  }

  return response.json() as Promise<unknown>;
}

export async function getToeicCatalog(): Promise<ToeicCatalogSource> {
  const rootUrl = getCatalogRootUrl();
  const manifest = parseManifest(
    await fetchJson(new URL("catalog.json", rootUrl), { cache: "no-store" }),
  );

  return { rootUrl: rootUrl.toString(), manifest };
}

export async function getToeicCatalogDocument(
  source: ToeicCatalogSource,
  path: string,
): Promise<ToeicCatalogDocument> {
  return parseDocument(
    await fetchJson(
      new URL(path, source.rootUrl),
      { cache: "no-store" },
    ),
  );
}

export function resolveToeicCatalogMediaUrl(
  source: ToeicCatalogSource,
  path: string | undefined,
): string | null {
  return path ? new URL(path, source.rootUrl).toString() : null;
}
