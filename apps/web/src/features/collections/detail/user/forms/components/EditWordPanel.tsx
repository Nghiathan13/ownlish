"use client";

import { FormEvent, useState } from "react";
import type {
  UpdateVocabWordInput,
  VocabWord,
} from "@/entities/vocab/api/vocab";
import { isOxfordDefinitionSource } from "@/entities/vocab/lib/vocabSources";
import { VocabWordFormFields } from "@/features/collections/detail/user/forms/components/VocabWordFormFields";
import {
  formatVocabWordFormError,
  getVocabWordDefinition,
  getVocabWordFormError,
  toUpdateVocabWordInput,
  toVocabWordFormValues,
  type VocabWordFormValues,
} from "@/features/collections/detail/user/forms/lib/vocabWordForm";
import { ApiError } from "@/shared/api/http";
import { useT } from "@/shared/providers/LocaleProvider";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

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
  const t = useT();
  const [values, setValues] = useState<VocabWordFormValues>(() =>
    toVocabWordFormValues(word, definitionId),
  );
  const [error, setError] = useState<string | null>(null);
  const definition = getVocabWordDefinition(word, definitionId);
  const lockWord = definition
    ? isOxfordDefinitionSource(definition.source)
    : false;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = getVocabWordFormError(values);

    if (validationError) {
      setError(formatVocabWordFormError(validationError, t));
      return;
    }

    try {
      await onUpdate(
        word,
        definitionId,
        toUpdateVocabWordInput(values, { lockWord }),
      );

      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : t("wordsTable.cannotUpdateWord"),
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
      <VocabWordFormFields
        disabled={isSubmitting}
        disableWordField={lockWord}
        onChange={updateValue}
        values={values}
      />

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          className={primaryTextButtonClassName()}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t("collections.saving")
            : t("collections.saveChanges")}
        </button>
        <button
          type="button"
          className={secondaryTextButtonClassName()}
          onClick={onClose}
          disabled={isSubmitting}
        >
          {t("wordsTable.cancel")}
        </button>
      </div>
    </form>
  );
}
