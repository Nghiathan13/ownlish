"use client";

import { FormEvent, useState } from "react";
import type {
  UpdateVocabWordInput,
  VocabWord,
} from "@/entities/vocab/api/vocab";
import {
  getVocabWordFormError,
  toUpdateVocabWordInput,
  toVocabWordFormValues,
  VOCAB_WORD_FORM_LIMITS,
  type VocabWordFormValues,
} from "@/features/vocabulary/lib/vocabWordForm";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { TextInput } from "@/shared/ui/TextInput";

type EditWordPanelProps = {
  definitionId: string;
  isSubmitting: boolean;
  onClose: () => void;
  onUpdate: (
    word: VocabWord,
    definitionId: string,
    input: UpdateVocabWordInput,
  ) => Promise<void>;
  word: VocabWord;
};

export function EditWordPanel({
  definitionId,
  isSubmitting,
  onClose,
  onUpdate,
  word,
}: EditWordPanelProps) {
  const [values, setValues] = useState<VocabWordFormValues>(() =>
    toVocabWordFormValues(word, definitionId),
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = getVocabWordFormError(values);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onUpdate(word, definitionId, toUpdateVocabWordInput(values, definitionId));

      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Cannot update word.",
      );
    }
  }

  function updateValue(field: keyof VocabWordFormValues, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    clearError();
  }

  function clearError() {
    if (error) {
      setError(null);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4"
      noValidate
      aria-busy={isSubmitting}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Word">
          <TextInput
            value={values.word}
            onChange={(event) => updateValue("word", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.word}
            required
            disabled={isSubmitting}
          />
        </Field>

        <Field label="Type">
          <TextInput
            value={values.type}
            onChange={(event) => updateValue("type", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.type}
            placeholder="noun, verb..."
            disabled={isSubmitting}
          />
        </Field>

        <Field label="IPA">
          <TextInput
            value={values.ipa}
            onChange={(event) => updateValue("ipa", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.ipa}
            placeholder="/wɜːd/"
            disabled={isSubmitting}
          />
        </Field>

        <Field label="Vietnamese meaning">
          <TextInput
            value={values.meaningVi}
            onChange={(event) => updateValue("meaningVi", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.meaningVi}
            disabled={isSubmitting}
          />
        </Field>
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
