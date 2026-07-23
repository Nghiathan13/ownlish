import type { CollectionSummary } from "@/entities/collection/api/collections";

export type CollectionCategory = "user" | "oxford";

export const collectionCategoryTabs: Array<{
  key: CollectionCategory;
  label: string;
}> = [
  { key: "user", label: "My Collections" },
  { key: "oxford", label: "Oxford" },
];

export function getCollectionCategory(
  collection: CollectionSummary,
): Exclude<CollectionCategory, "user"> | null {
  const source = collection.source?.toLowerCase() ?? "";
  const name = collection.name.toLowerCase();
  const text = `${source} ${name}`;

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

export function getCollectionPath(collection: CollectionSummary) {
  return `/collections/user/${collection.id}`;
}

export function getCollectionsListCategory(
  collection: CollectionSummary,
): CollectionCategory {
  if (collection.kind === "USER") {
    return "user";
  }

  return getCollectionCategory(collection) ?? "oxford";
}

export function getCollectionsListPath(category: CollectionCategory) {
  if (category === "oxford") {
    return "/collections/oxford/A1";
  }

  return `/collections/${category}`;
}

export function parseCollectionCategoryTab(
  value: string | null,
): CollectionCategory | null {
  if (value == null) {
    return null;
  }

  return collectionCategoryTabs.some((tab) => tab.key === value)
    ? (value as CollectionCategory)
    : null;
}

export function getCollectionsLegacyRedirectPath(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): string | null {
  const tabParam = searchParams.get("tab");
  if (tabParam == null) {
    return null;
  }

  // Retired collection tabs redirect to My Collections.
  if (tabParam === "toeic" || tabParam === "ielts") {
    return getCollectionsListPath("user");
  }

  const category = parseCollectionCategoryTab(tabParam) ?? "user";

  if (category !== "oxford") {
    return getCollectionsListPath(category);
  }

  const bandParam = searchParams.get("band");
  const groupParam = searchParams.get("group");
  const resolvedBand =
    bandParam && ["A1", "A2", "B1", "B2", "C1"].includes(bandParam)
      ? bandParam
      : "A1";

  if (groupParam && /^\d+$/.test(groupParam) && Number(groupParam) > 0) {
    return `/collections/oxford/${resolvedBand}/part-${groupParam}`;
  }

  return `/collections/oxford/${resolvedBand}`;
}

export function findCollectionById(
  collections: CollectionSummary[],
  collectionId: string,
) {
  return collections.find((collection) => collection.id === collectionId) ?? null;
}
