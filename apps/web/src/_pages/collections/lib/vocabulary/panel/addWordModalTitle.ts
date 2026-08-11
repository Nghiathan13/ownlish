type AddWordModalTitleTranslator = (
  key: "wordsTable.addWord" | "wordsTable.addWordToCollectionPrefix",
) => string;

type AddWordModalTitleParts = {
  collectionName: string;
  prefix: string | null;
};

export function getAddWordModalTitleParts(
  collectionName: string | null,
  t: AddWordModalTitleTranslator,
): AddWordModalTitleParts {
  if (!collectionName) {
    return { collectionName: t("wordsTable.addWord"), prefix: null };
  }

  return {
    collectionName,
    prefix: t("wordsTable.addWordToCollectionPrefix"),
  };
}
