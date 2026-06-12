"use client";

import { FormEvent, useState } from "react";
import type { CreateVocabWordInput } from "@/entities/vocab/api/vocab";
import {
  EMPTY_VOCAB_WORD_FORM_VALUES,
  getVocabWordFormError,
  toCreateVocabWordInput,
  VOCAB_WORD_FORM_LIMITS,
  type VocabWordFormValues,
} from "@/features/vocabulary/lib/vocabWordForm";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { TextInput } from "@/shared/ui/TextInput";

type AddWordFormProps = {
  onCreate: (input: CreateVocabWordInput) => Promise<void>;
  onCreated?: () => void;
};

export function AddWordForm({ onCreate, onCreated }: AddWordFormProps) {
  const [values, setValues] = useState<VocabWordFormValues>(
    EMPTY_VOCAB_WORD_FORM_VALUES,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = getVocabWordFormError(values);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate(toCreateVocabWordInput(values));

      setValues(EMPTY_VOCAB_WORD_FORM_VALUES);
      onCreated?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Cannot add word.",
      );
    } finally {
      setIsSubmitting(false);
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

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add word"}
        </Button>
      </div>
    </form>
  );
}
