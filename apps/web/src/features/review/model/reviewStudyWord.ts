import type { OxfordReviewItem } from "@/entities/review/api/oxfordReview";
import type { VocabReviewItem } from "@/entities/vocab/api/vocab";

export type ReviewStudyDefinition = {
  id: string;
  definition: string | null;
  example: string | null;
  exampleVi: string | null;
  meaningVi: string | null;
  type: string | null;
};

export type ReviewStudyWord = {
  band: string | null;
  definitions: ReviewStudyDefinition[];
  id: string;
  ipa: string | null;
  types: string[];
  word: string;
};

export function toReviewStudyWord(word: VocabReviewItem): ReviewStudyWord {
  return {
    band: word.band,
    definitions: [
      {
        id: word.id,
        definition: word.definition,
        example: word.example,
        exampleVi: word.exampleVi,
        meaningVi: word.meaningVi,
        type: word.type,
      },
    ],
    id: word.id,
    ipa: word.ipaUk ?? word.ipaUs,
    types: word.type ? [word.type] : [],
    word: word.vocabWord.word,
  };
}

export function toOxfordReviewStudyWord(word: OxfordReviewItem): ReviewStudyWord {
  const { definition } = word;
  return {
    band: definition.band,
    definitions: [
      {
        id: definition.id,
        definition: definition.definition,
        example: definition.example,
        exampleVi: definition.exampleVi,
        meaningVi: definition.meaningVi,
        type: definition.type,
      },
    ],
    id: word.id,
    ipa: definition.ipaUk ?? definition.ipaUs,
    types: definition.type ? [definition.type] : [],
    word: word.word,
  };
}
