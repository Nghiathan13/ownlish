import type {
  CreateVocabWordInput,
  UpdateVocabWordInput,
  VocabWord,
} from "@/entities/vocab/api/vocab";

export type VocabWordFormValues = {
  ipa: string;
  meaningVi: string;
  type: string;
  word: string;
};

export const VOCAB_WORD_FORM_LIMITS = {
  ipa: 120,
  meaningVi: 500,
  type: 80,
  word: 120,
} as const;

export const EMPTY_VOCAB_WORD_FORM_VALUES: VocabWordFormValues = {
  ipa: "",
  meaningVi: "",
  type: "",
  word: "",
};

function optionalValue(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
}

export function getVocabWordFormError(values: VocabWordFormValues) {
  const trimmedWord = values.word.trim();

  if (!trimmedWord) {
    return "Word is required.";
  }

  if (trimmedWord.length > VOCAB_WORD_FORM_LIMITS.word) {
    return `Word must be at most ${VOCAB_WORD_FORM_LIMITS.word} characters.`;
  }

  if (values.ipa.trim().length > VOCAB_WORD_FORM_LIMITS.ipa) {
    return `IPA must be at most ${VOCAB_WORD_FORM_LIMITS.ipa} characters.`;
  }

  if (values.type.trim().length > VOCAB_WORD_FORM_LIMITS.type) {
    return `Type must be at most ${VOCAB_WORD_FORM_LIMITS.type} characters.`;
  }

  if (values.meaningVi.trim().length > VOCAB_WORD_FORM_LIMITS.meaningVi) {
    return `Vietnamese meaning must be at most ${VOCAB_WORD_FORM_LIMITS.meaningVi} characters.`;
  }

  return null;
}

export function toCreateVocabWordInput(
  values: VocabWordFormValues,
): CreateVocabWordInput {
  return {
    word: values.word.trim(),
    ipa: optionalValue(values.ipa),
    type: optionalValue(values.type),
    meaningVi: optionalValue(values.meaningVi),
  };
}

export function toUpdateVocabWordInput(
  values: VocabWordFormValues,
): UpdateVocabWordInput {
  return toCreateVocabWordInput(values);
}

export function toVocabWordFormValues(word: VocabWord): VocabWordFormValues {
  const definition =
    word.definitions.find((item) => item.source === "manual") ??
    word.definitions[0];

  return {
    word: word.word,
    ipa: definition?.ipaUk ?? definition?.ipaUs ?? "",
    type: definition?.type ?? "",
    meaningVi: definition?.meaningVi ?? "",
  };
}
