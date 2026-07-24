"use client";

import { FormEvent, useState } from "react";
import type {
  CollectionSummary,
  UpdateCollectionInput,
} from "@/entities/collection/api/collections";
import { ApiError } from "@/shared/api/http";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { Field } from "@/shared/ui/Field";
import { TextInput } from "@/shared/ui/TextInput";
import { Textarea } from "@/shared/ui/Textarea";

const COLLECTION_NAME_MAX_LENGTH = 120;
const COLLECTION_DESCRIPTION_MAX_LENGTH = 500;

type EditCollectionFormProps = {
  collection: CollectionSummary;
  onSubmit: (input: UpdateCollectionInput) => Promise<void>;
  onUpdated?: () => void;
};

export function EditCollectionForm({
  collection,
  onSubmit,
  onUpdated,
}: EditCollectionFormProps) {
  const t = useT();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(t("collections.nameRequired"));
      return;
    }

    if (trimmedName.length > COLLECTION_NAME_MAX_LENGTH) {
      setError(
        formatMessage(t("collections.nameMaxLength"), {
          max: COLLECTION_NAME_MAX_LENGTH,
        }),
      );
      return;
    }

    const trimmedDescription = description.trim();

    if (trimmedDescription.length > COLLECTION_DESCRIPTION_MAX_LENGTH) {
      setError(
        formatMessage(t("collections.descriptionMaxLength"), {
          max: COLLECTION_DESCRIPTION_MAX_LENGTH,
        }),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: trimmedName,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      });
      onUpdated?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : t("collections.cannotUpdate"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      key={collection.id}
      className="grid gap-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field label={t("collections.name")}>
        <TextInput
          id={`collection-name-${collection.id}`}
          maxLength={COLLECTION_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("collections.namePlaceholder")}
          value={name}
        />
      </Field>

      <Field label={t("collections.descriptionOptional")}>
        <Textarea
          id={`collection-description-${collection.id}`}
          maxLength={COLLECTION_DESCRIPTION_MAX_LENGTH}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t("collections.descriptionPlaceholder")}
          rows={3}
          value={description}
        />
      </Field>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        className={primaryTextButtonClassName("w-fit")}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? t("collections.saving") : t("collections.saveChanges")}
      </button>
    </form>
  );
}
