import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
import { formatDisplayDate } from "@/shared/lib/date";

type DisplayVocabDefinition = Pick<
  VocabWordDefinition,
  | "id"
  | "type"
  | "meaningVi"
  | "definition"
  | "example"
  | "ipaUk"
  | "ipaUs"
  | "band"
  | "level"
  | "nextReview"
>;

export function getDisplayVocabDefinitions(
  word: VocabWord,
): DisplayVocabDefinition[] {
  return word.definitions;
}

export function getVocabWordIpa(word: VocabWord) {
  const definitionWithIpa = getDisplayVocabDefinitions(word).find(
    (definition) => definition.ipaUk || definition.ipaUs,
  );

  return definitionWithIpa?.ipaUk ?? definitionWithIpa?.ipaUs ?? null;
}

export function getVocabWordTypeText(word: VocabWord) {
  const types = Array.from(
    new Set(
      getDisplayVocabDefinitions(word)
        .map((definition) => definition.type?.trim())
        .filter((type): type is string => Boolean(type)),
    ),
  );

  return types.length > 0 ? types.join("; ") : null;
}

export function getVocabWordNextReviewText(word: VocabWord) {
  const definitions = getDisplayVocabDefinitions(word);

  if (definitions.length === 0) {
    return "-";
  }

  if (definitions.some((definition) => definition.nextReview === null)) {
    return "Not scheduled";
  }

  const nextReview = definitions
    .map((definition) => definition.nextReview)
    .filter((value): value is string => Boolean(value))
    .sort()[0];

  return nextReview ? formatDisplayDate(nextReview) : "-";
}
