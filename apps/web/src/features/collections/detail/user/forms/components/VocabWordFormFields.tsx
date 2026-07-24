"use client";

import { VOCAB_WORD_FORM_LIMITS } from "@/features/collections/detail/user/forms/constants/vocabWordFormLimits";
import type { VocabWordFormValues } from "@/features/collections/detail/user/forms/lib/vocabWordForm";
import { useT } from "@/shared/providers/LocaleProvider";
import { Field } from "@/shared/ui/Field";
import { TextInput } from "@/shared/ui/TextInput";
import { Textarea } from "@/shared/ui/Textarea";

type VocabWordFormFieldsProps = {
  disabled?: boolean;
  disableWordField?: boolean;
  onChange: (field: keyof VocabWordFormValues, value: string) => void;
  values: VocabWordFormValues;
};

export function VocabWordFormFields({
  disabled = false,
  disableWordField = false,
  onChange,
  values,
}: VocabWordFormFieldsProps) {
  const t = useT();

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("wordsTable.word")}>
          <TextInput
            value={values.word}
            onChange={(event) => onChange("word", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.word}
            required
            disabled={disabled || disableWordField}
          />
        </Field>

        <Field label={t("wordsTable.type")}>
          <TextInput
            value={values.type}
            onChange={(event) => onChange("type", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.type}
            placeholder={t("wordsTable.typePlaceholder")}
            disabled={disabled}
          />
        </Field>

        <Field label={t("wordsTable.ipaUk")}>
          <TextInput
            value={values.ipaUk}
            onChange={(event) => onChange("ipaUk", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.ipaUk}
            placeholder="/wɜːd/"
            disabled={disabled}
          />
        </Field>

        <Field label={t("wordsTable.ipaUs")}>
          <TextInput
            value={values.ipaUs}
            onChange={(event) => onChange("ipaUs", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.ipaUs}
            placeholder="/wɝːd/"
            disabled={disabled}
          />
        </Field>

        <Field label={t("wordsTable.band")}>
          <TextInput
            value={values.band}
            onChange={(event) => onChange("band", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.band}
            placeholder={t("wordsTable.bandPlaceholder")}
            disabled={disabled}
          />
        </Field>

        <Field label={t("wordsTable.meaningVi")}>
          <TextInput
            value={values.meaningVi}
            onChange={(event) => onChange("meaningVi", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.meaningVi}
            disabled={disabled}
          />
        </Field>
      </div>

      <Field label={t("wordsTable.definition")}>
        <Textarea
          value={values.definition}
          onChange={(event) => onChange("definition", event.target.value)}
          maxLength={VOCAB_WORD_FORM_LIMITS.definition}
          disabled={disabled}
        />
      </Field>

      <Field label={t("wordsTable.example")}>
        <Textarea
          value={values.example}
          onChange={(event) => onChange("example", event.target.value)}
          maxLength={VOCAB_WORD_FORM_LIMITS.example}
          disabled={disabled}
        />
      </Field>

      <Field label={t("wordsTable.exampleVi")}>
        <Textarea
          value={values.exampleVi}
          onChange={(event) => onChange("exampleVi", event.target.value)}
          maxLength={VOCAB_WORD_FORM_LIMITS.exampleVi}
          disabled={disabled}
        />
      </Field>
    </div>
  );
}
