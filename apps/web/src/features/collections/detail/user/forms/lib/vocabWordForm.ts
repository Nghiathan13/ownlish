import type {
  CreateVocabWordInput,
  UpdateVocabWordInput,
  VocabWord,
  VocabWordDefinition,
} from "@/entities/vocab/api/vocab";
import { VOCAB_WORD_FORM_LIMITS } from "@/features/collections/detail/user/forms/constants/vocabWordFormLimits";
import type { MessageKey } from "@/shared/i18n/messages";

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

export type VocabWordFormField =
  | "word"
  | "type"
  | "ipaUk"
  | "ipaUs"
  | "band"
  | "meaningVi"
  | "definition"
  | "example"
  | "exampleVi";

export type VocabWordFormValidationError =
  | { code: "wordRequired" }
  | { code: "maxLength"; field: VocabWordFormField; limit: number };

const FIELD_LABEL_KEYS: Record<VocabWordFormField, MessageKey> = {
  word: "wordsTable.word",
  type: "wordsTable.type",
  ipaUk: "wordsTable.ipaUk",
  ipaUs: "wordsTable.ipaUs",
  band: "wordsTable.band",
  meaningVi: "wordsTable.meaningVi",
  definition: "wordsTable.definition",
  example: "wordsTable.example",
  exampleVi: "wordsTable.exampleVi",
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
  field: VocabWordFormField,
): VocabWordFormValidationError | null {
  if (value.trim().length > limit) {
    return { code: "maxLength", field, limit };
  }

  return null;
}

export function getVocabWordFormError(
  values: VocabWordFormValues,
): VocabWordFormValidationError | null {
  const trimmedWord = values.word.trim();

  if (!trimmedWord) {
    return { code: "wordRequired" };
  }

  const fieldChecks: Array<[string, number, VocabWordFormField]> = [
    [values.word, VOCAB_WORD_FORM_LIMITS.word, "word"],
    [values.type, VOCAB_WORD_FORM_LIMITS.type, "type"],
    [values.ipaUk, VOCAB_WORD_FORM_LIMITS.ipaUk, "ipaUk"],
    [values.ipaUs, VOCAB_WORD_FORM_LIMITS.ipaUs, "ipaUs"],
    [values.band, VOCAB_WORD_FORM_LIMITS.band, "band"],
    [values.meaningVi, VOCAB_WORD_FORM_LIMITS.meaningVi, "meaningVi"],
    [values.definition, VOCAB_WORD_FORM_LIMITS.definition, "definition"],
    [values.example, VOCAB_WORD_FORM_LIMITS.example, "example"],
    [values.exampleVi, VOCAB_WORD_FORM_LIMITS.exampleVi, "exampleVi"],
  ];

  for (const [value, limit, field] of fieldChecks) {
    const error = validateMaxLength(value, limit, field);

    if (error) {
      return error;
    }
  }

  return null;
}

export function formatVocabWordFormError(
  error: VocabWordFormValidationError,
  t: (key: MessageKey) => string,
) {
  if (error.code === "wordRequired") {
    return t("wordsTable.wordRequired");
  }

  return t("wordsTable.fieldMaxLength")
    .replaceAll("{field}", t(FIELD_LABEL_KEYS[error.field]))
    .replaceAll("{max}", String(error.limit));
}

function toDefinitionInputFields(
  values: VocabWordFormValues,
): Omit<CreateVocabWordInput, "word" | "collectionId"> {
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
): Omit<CreateVocabWordInput, "collectionId"> {
  return {
    word: values.word.trim(),
    ...toDefinitionInputFields(values),
  };
}

export function toUpdateVocabWordInput(
  values: VocabWordFormValues,
  options?: { lockWord?: boolean },
): UpdateVocabWordInput {
  const definitionFields = toDefinitionInputFields(values);

  return {
    ...(options?.lockWord ? {} : { word: values.word.trim() }),
    ...definitionFields,
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
