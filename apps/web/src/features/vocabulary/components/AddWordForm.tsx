"use client";

import { FormEvent, useState } from "react";
import type { CreateVocabWordInput } from "@/entities/vocab/api/vocab";
import { VocabWordFormFields } from "@/features/vocabulary/components/VocabWordFormFields";
import {
  EMPTY_VOCAB_WORD_FORM_VALUES,
  getVocabWordFormError,
  toCreateVocabWordInput,
  type VocabWordFormValues,
} from "@/features/vocabulary/lib/vocabWordForm";
import { ApiError } from "@/shared/api/http";
import { primaryTextButtonClassName } from "@/shared/ui/button";

type AddWordFormProps = {
  onCreate: (input: Omit<CreateVocabWordInput, "collectionId">) => Promise<void>;
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
      <VocabWordFormFields
        disabled={isSubmitting}
        onChange={updateValue}
        values={values}
      />

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          className={primaryTextButtonClassName()}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add word"}
        </button>
      </div>
    </form>
  );
}
