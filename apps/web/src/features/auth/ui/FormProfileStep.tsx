"use client";

import type { FormEvent } from "react";
import { useT } from "@/shared/providers/LocaleProvider";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { TextInput } from "@/shared/ui/TextInput";

type FormProfileStepProps = {
  error: string | null;
  isSubmitting: boolean;
  name: string;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function FormProfileStep({
  error,
  isSubmitting,
  name,
  onNameChange,
  onSubmit,
}: FormProfileStepProps) {
  const t = useT();

  return (
    <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
      <p className="m-0 text-sm text-muted-foreground">
        {t("auth.nameDescription")}
      </p>
      <TextInput
        aria-label={t("auth.name")}
        autoComplete="name"
        className="w-full rounded-md px-4 py-2 focus:border-primary"
        maxLength={80}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder={t("auth.name")}
        required
        value={name}
      />
      {error ? (
        <p className="m-0 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className={primaryTextButtonClassName(
          "border-primary bg-primary text-primary-foreground enabled:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
        )}
        disabled={isSubmitting || name.trim().length === 0}
        type="submit"
      >
        {isSubmitting ? t("auth.pleaseWait") : t("auth.finish")}
      </button>
    </form>
  );
}
