"use client";

import { FormEvent, useState } from "react";
import type {
  CollectionSummary,
  UpdateCollectionInput,
} from "@/entities/collection/api/collections";
import { ApiError } from "@/shared/api/http";
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
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Collection name is required.");
      return;
    }

    if (trimmedName.length > COLLECTION_NAME_MAX_LENGTH) {
      setError(
        `Collection name must be at most ${COLLECTION_NAME_MAX_LENGTH} characters.`,
      );
      return;
    }

    const trimmedDescription = description.trim();

    if (trimmedDescription.length > COLLECTION_DESCRIPTION_MAX_LENGTH) {
      setError(
        `Description must be at most ${COLLECTION_DESCRIPTION_MAX_LENGTH} characters.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: trimmedName,
        ...(trimmedDescription
          ? { description: trimmedDescription }
          : {}),
      });
      onUpdated?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Cannot update collection.",
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
      <Field label="Name">
        <TextInput
          id={`collection-name-${collection.id}`}
          maxLength={COLLECTION_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. TOEIC prep"
          value={name}
        />
      </Field>

      <Field label="Description (optional)">
        <Textarea
          id={`collection-description-${collection.id}`}
          maxLength={COLLECTION_DESCRIPTION_MAX_LENGTH}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What is this collection for?"
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
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
