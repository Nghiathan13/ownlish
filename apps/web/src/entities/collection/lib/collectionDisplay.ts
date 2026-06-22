import type { CollectionSummary } from "@/entities/collection/api/collections";

export type CollectionCategory = "user" | "oxford" | "toeic" | "ielts";

export const collectionCategoryTabs: Array<{
  key: CollectionCategory;
  label: string;
}> = [
  { key: "user", label: "My Collections" },
  { key: "oxford", label: "Oxford" },
  { key: "toeic", label: "TOEIC" },
  { key: "ielts", label: "IELTS" },
];

export function getCollectionCategory(
  collection: CollectionSummary,
): Exclude<CollectionCategory, "user"> | null {
  const source = collection.source?.toLowerCase() ?? "";
  const name = collection.name.toLowerCase();
  const text = `${source} ${name}`;

  if (text.includes("toeic")) return "toeic";
  if (text.includes("ielts")) return "ielts";
  if (text.includes("oxford")) return "oxford";

  return null;
}

export function filterCollectionsByCategory(
  collections: CollectionSummary[],
  category: CollectionCategory,
) {
  if (category === "user") {
    return collections.filter((collection) => collection.kind === "USER");
  }

  return collections.filter(
    (collection) =>
      collection.kind === "SYSTEM" &&
      getCollectionCategory(collection) === category,
  );
}

export function getCollectionSlug(collection: CollectionSummary) {
  const source = toSlugPart(collection.source ?? collection.name);
  const level = collection.cefrLevel ? toSlugPart(collection.cefrLevel) : "";
  const slug = [source, level].filter(Boolean).join("-");

  return slug || collection.id;
}

export function findCollectionBySlug(
  collections: CollectionSummary[],
  slug: string,
) {
  return (
    collections.find((collection) => getCollectionSlug(collection) === slug) ??
    collections.find((collection) => collection.id === slug) ??
    null
  );
}

function toSlugPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
