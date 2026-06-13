import type {
  CreateVocabWordInput,
  UpdateVocabWordInput,
  VocabWord,
  VocabWordDefinition,
} from "@/entities/vocab/api/vocab";

export type VocabWordFormValues = {
  band: string;
  definition: string;
  example: string;
  exampleVi: string;
  ipaUk: string;
  ipaUs: string;
  meaningVi: string;
  type: string;
  word: string;
};

export const VOCAB_WORD_FORM_LIMITS = {
  band: 40,
  definition: 1000,
  example: 1000,
  exampleVi: 1000,
  ipaUk: 120,
  ipaUs: 120,
  meaningVi: 500,
  type: 80,
  word: 120,
} as const;

export const EMPTY_VOCAB_WORD_FORM_VALUES: VocabWordFormValues = {
  band: "",
  definition: "",
  example: "",
  exampleVi: "",
  ipaUk: "",
  ipaUs: "",
  meaningVi: "",
  type: "",
  word: "",
};

function optionalValue(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
}

export function getVocabWordDefinition(
  word: VocabWord,
  definitionId: string,
): VocabWordDefinition | undefined {
  return word.definitions.find((definition) => definition.id === definitionId);
}

function validateMaxLength(
  value: string,
  limit: number,
  label: string,
): string | null {
  if (value.trim().length > limit) {
    return `${label} must be at most ${limit} characters.`;
  }

  return null;
}

export function getVocabWordFormError(values: VocabWordFormValues) {
  const trimmedWord = values.word.trim();

  if (!trimmedWord) {
    return "Word is required.";
  }

  const fieldChecks: Array<[string, number, string]> = [
    [values.word, VOCAB_WORD_FORM_LIMITS.word, "Word"],
    [values.type, VOCAB_WORD_FORM_LIMITS.type, "Type"],
    [values.ipaUk, VOCAB_WORD_FORM_LIMITS.ipaUk, "IPA UK"],
    [values.ipaUs, VOCAB_WORD_FORM_LIMITS.ipaUs, "IPA US"],
    [values.band, VOCAB_WORD_FORM_LIMITS.band, "Band"],
    [values.meaningVi, VOCAB_WORD_FORM_LIMITS.meaningVi, "Vietnamese meaning"],
    [values.definition, VOCAB_WORD_FORM_LIMITS.definition, "Definition"],
    [values.example, VOCAB_WORD_FORM_LIMITS.example, "Example"],
    [values.exampleVi, VOCAB_WORD_FORM_LIMITS.exampleVi, "Vietnamese example"],
  ];

  for (const [value, limit, label] of fieldChecks) {
    const error = validateMaxLength(value, limit, label);

    if (error) {
      return error;
    }
  }

  return null;
}

function toDefinitionInputFields(
  values: VocabWordFormValues,
): Omit<CreateVocabWordInput, "word"> {
  return {
    band: optionalValue(values.band),
    definition: optionalValue(values.definition),
    example: optionalValue(values.example),
    exampleVi: optionalValue(values.exampleVi),
    ipaUk: optionalValue(values.ipaUk),
    ipaUs: optionalValue(values.ipaUs),
    meaningVi: optionalValue(values.meaningVi),
    type: optionalValue(values.type),
  };
}

export function toCreateVocabWordInput(
  values: VocabWordFormValues,
): CreateVocabWordInput {
  return {
    word: values.word.trim(),
    ...toDefinitionInputFields(values),
  };
}

export function toUpdateVocabWordInput(
  values: VocabWordFormValues,
  definitionId: string,
): UpdateVocabWordInput {
  return {
    ...toCreateVocabWordInput(values),
    definitionId,
  };
}

export function toVocabWordFormValues(
  word: VocabWord,
  definitionId?: string,
): VocabWordFormValues {
  const definition = definitionId
    ? getVocabWordDefinition(word, definitionId)
    : undefined;

  return {
    word: word.word,
    type: definition?.type ?? "",
    ipaUk: definition?.ipaUk ?? "",
    ipaUs: definition?.ipaUs ?? "",
    band: definition?.band ?? "",
    meaningVi: definition?.meaningVi ?? "",
    definition: definition?.definition ?? "",
    example: definition?.example ?? "",
    exampleVi: definition?.exampleVi ?? "",
  };
}
