"use client";

import { FormEvent, useState } from "react";
import type {
  UpdateVocabWordInput,
  VocabWord,
} from "@/entities/vocab/api/vocab";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { TextInput } from "@/shared/ui/TextInput";

type EditWordPanelProps = {
  isSubmitting: boolean;
  onCancel: () => void;
  onUpdate: (word: VocabWord, input: UpdateVocabWordInput) => Promise<void>;
  word: VocabWord;
};

function optionalValue(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
}

export function EditWordPanel({
  isSubmitting,
  onCancel,
  onUpdate,
  word,
}: EditWordPanelProps) {
  const [wordValue, setWordValue] = useState(word.word);
  const [ipa, setIpa] = useState(word.ipa ?? "");
  const [type, setType] = useState(word.type ?? "");
  const [meaningVi, setMeaningVi] = useState(word.meaningVi ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedWord = wordValue.trim();

    if (!trimmedWord) {
      setError("Word is required.");
      return;
    }

    try {
      await onUpdate(word, {
        word: trimmedWord,
        ipa: optionalValue(ipa),
        type: optionalValue(type),
        meaningVi: optionalValue(meaningVi),
      });

      onCancel();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Cannot update word.",
      );
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
      className="mt-6 grid gap-4 rounded-xl border border-border p-4"
      noValidate
    >
      <div>
        <h2 className="text-lg font-semibold">Edit word</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the selected vocabulary word.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Word">
          <TextInput
            value={wordValue}
            onChange={(event) => {
              setWordValue(event.target.value);
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

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
