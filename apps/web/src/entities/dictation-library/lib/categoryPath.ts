import type { DictationCatalogIndexCategory } from "../model/types";

export function getDictationCategoryPath(categoryId: string) {
  return `/dictation/${categoryId}`;
}

export function findDictationCatalogCategory(
  categories: DictationCatalogIndexCategory[],
  categoryId: string,
) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

export function findDictationCatalogCategoryByLabel(
  categories: DictationCatalogIndexCategory[],
  label: string,
) {
  return categories.find((category) => category.label === label) ?? null;
}
