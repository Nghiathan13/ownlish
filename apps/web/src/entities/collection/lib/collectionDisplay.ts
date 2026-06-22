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
    return collections.filter(
      (collection) => collection.kind === "USER" && !collection.isDefault,
    );
  }

  return collections.filter(
    (collection) =>
      collection.kind === "SYSTEM" &&
      getCollectionCategory(collection) === category,
  );
}

export function getDefaultUserCollection(collections: CollectionSummary[]) {
  return collections.find((collection) => collection.isDefault) ?? null;
}

export function getUserOwnedCollections(collections: CollectionSummary[]) {
  return collections
    .filter((collection) => collection.kind === "USER")
    .sort((left, right) => {
      if (left.isDefault !== right.isDefault) {
        return left.isDefault ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
}

export type CollectionKindHint = "system" | "user";

export function getCollectionKindHint(
  collection: CollectionSummary,
): CollectionKindHint {
  return collection.kind === "SYSTEM" ? "system" : "user";
}

export function getCollectionPath(collection: CollectionSummary) {
  return `/collections/${collection.id}?kind=${getCollectionKindHint(collection)}`;
}

export function parseCollectionKindHint(
  value: string | null,
): CollectionSummary["kind"] | null {
  if (value === "system") {
    return "SYSTEM";
  }

  if (value === "user") {
    return "USER";
  }

  return null;
}

export function findCollectionById(
  collections: CollectionSummary[],
  collectionId: string,
) {
  return collections.find((collection) => collection.id === collectionId) ?? null;
}
