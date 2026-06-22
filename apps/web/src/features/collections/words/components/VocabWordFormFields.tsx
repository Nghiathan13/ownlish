import { VOCAB_WORD_FORM_LIMITS } from "@/features/collections/words/constants/vocabWordFormLimits";
import type { VocabWordFormValues } from "@/features/collections/words/lib/vocabWordForm";
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
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Word">
          <TextInput
            value={values.word}
            onChange={(event) => onChange("word", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.word}
            required
            disabled={disabled || disableWordField}
          />
        </Field>

        <Field label="Type">
          <TextInput
            value={values.type}
            onChange={(event) => onChange("type", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.type}
            placeholder="noun, verb..."
            disabled={disabled}
          />
        </Field>

        <Field label="IPA UK">
          <TextInput
            value={values.ipaUk}
            onChange={(event) => onChange("ipaUk", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.ipaUk}
            placeholder="/wɜːd/"
            disabled={disabled}
          />
        </Field>

        <Field label="IPA US">
          <TextInput
            value={values.ipaUs}
            onChange={(event) => onChange("ipaUs", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.ipaUs}
            placeholder="/wɝːd/"
            disabled={disabled}
          />
        </Field>

        <Field label="Band">
          <TextInput
            value={values.band}
            onChange={(event) => onChange("band", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.band}
            placeholder="A1, B2..."
            disabled={disabled}
          />
        </Field>

        <Field label="Vietnamese meaning">
          <TextInput
            value={values.meaningVi}
            onChange={(event) => onChange("meaningVi", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.meaningVi}
            disabled={disabled}
          />
        </Field>
      </div>

      <Field label="Definition">
        <Textarea
          value={values.definition}
          onChange={(event) => onChange("definition", event.target.value)}
          maxLength={VOCAB_WORD_FORM_LIMITS.definition}
          disabled={disabled}
        />
      </Field>

      <Field label="Example">
        <Textarea
          value={values.example}
          onChange={(event) => onChange("example", event.target.value)}
          maxLength={VOCAB_WORD_FORM_LIMITS.example}
          disabled={disabled}
        />
      </Field>

      <Field label="Vietnamese example">
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
