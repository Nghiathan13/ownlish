const categoryPathByName = {
  BBC: "/dictation/bbc",
  Music: "/dictation/music",
} as const;

export function getDictationCategoryPath(category: string) {
  return categoryPathByName[category as keyof typeof categoryPathByName] ?? "/dictation";
}
