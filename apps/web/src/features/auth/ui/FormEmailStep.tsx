"use client";

import type { FormEvent } from "react";
import {
  GoogleSignInButton,
  isGoogleSignInConfigured,
} from "./GoogleSignInButton";
import { useT } from "@/shared/lib/providers";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { EmailIcon } from "@/shared/ui/icons";
import { TextInput } from "@/shared/ui/TextInput";

type FormEmailStepProps = {
  email: string;
  error: string | null;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onGoogleCode: (code: string) => void | Promise<void>;
  onGoogleError: (message: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function FormEmailStep({
  email,
  error,
  isSubmitting,
  onEmailChange,
  onGoogleCode,
  onGoogleError,
  onSubmit,
}: FormEmailStepProps) {
  const t = useT();

  return (
    <div className="mt-6 grid gap-4">
      {isGoogleSignInConfigured ? (
        <>
          <GoogleSignInButton
            disabled={isSubmitting}
            onCode={onGoogleCode}
            onError={onGoogleError}
          />
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">{t("auth.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="relative">
          <EmailIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
          <TextInput
            aria-label={t("auth.email")}
            autoComplete="email"
            className="w-full rounded-md px-4 py-2 pl-11 pr-4 focus:border-primary"
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder={t("auth.email")}
            required
            type="email"
            value={email}
          />
        </div>

        {error ? (
          <p className="m-0 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className={primaryTextButtonClassName(
            "border-primary bg-primary text-primary-foreground enabled:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
          )}
          disabled={isSubmitting || email.trim().length === 0}
          type="submit"
        >
          {isSubmitting ? t("auth.pleaseWait") : t("auth.continue")}
        </button>
      </form>
    </div>
  );
}
