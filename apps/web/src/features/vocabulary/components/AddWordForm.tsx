"use client";

import { FormEvent, useState } from "react";
import type { CreateVocabWordInput } from "@/entities/vocab/api/vocab";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { TextInput } from "@/shared/ui/TextInput";

type AddWordFormProps = {
  onCreate: (input: CreateVocabWordInput) => Promise<void>;
};

function optionalValue(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
}

export function AddWordForm({ onCreate }: AddWordFormProps) {
  const [word, setWord] = useState("");
  const [ipa, setIpa] = useState("");
  const [type, setType] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedWord = word.trim();

    if (!trimmedWord) {
      setError("Word is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate({
        word: trimmedWord,
        ipa: optionalValue(ipa),
        type: optionalValue(type),
        meaningVi: optionalValue(meaningVi),
      });

      setWord("");
      setIpa("");
      setType("");
      setMeaningVi("");
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

  function clearError() {
    if (error) {
      setError(null);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 grid gap-4 rounded-xl border border-border p-4"
      noValidate
    >
      <div>
        <h2 className="text-lg font-semibold">Add word</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a word to your vocabulary list.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Word">
          <TextInput
            value={word}
            onChange={(event) => {
              setWord(event.target.value);
              clearError();
            }}
            maxLength={120}
            required
          />
        </Field>

        <Field label="Type">
          <TextInput
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              clearError();
            }}
            maxLength={80}
            placeholder="noun, verb..."
          />
        </Field>

        <Field label="IPA">
          <TextInput
            value={ipa}
            onChange={(event) => {
              setIpa(event.target.value);
              clearError();
            }}
            maxLength={120}
            placeholder="/wɜːd/"
          />
        </Field>

        <Field label="Vietnamese meaning">
          <TextInput
            value={meaningVi}
            onChange={(event) => {
              setMeaningVi(event.target.value);
              clearError();
            }}
            maxLength={500}
          />
        </Field>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Adding..." : "Add word"}
      </Button>
    </form>
  );
}
