"use client";

import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
} from "react";
import { useT } from "@/shared/lib/providers";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { classNames } from "@/shared/lib/classNames";

const OTP_LENGTH = 6;

type FormOtpStepProps = {
  code: string;
  email: string;
  error: string | null;
  isSubmitting: boolean;
  resendRemainingSeconds: number;
  onCodeChange: (value: string) => void;
  onResend: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function normalizeCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

function digitsFromCode(code: string): string[] {
  const digits = normalizeCode(code).split("");
  while (digits.length < OTP_LENGTH) {
    digits.push("");
  }
  return digits;
}

/**
 * Simple left-pack OTP: React-controlled via `code` / `onCodeChange` only.
 * No codeRef, no debounce, no scheduled sync.
 */
export function FormOtpStep({
  code,
  email,
  error,
  isSubmitting,
  resendRemainingSeconds,
  onCodeChange,
  onResend,
  onSubmit,
}: FormOtpStepProps) {
  const t = useT();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = digitsFromCode(code);
  const normalizedCode = normalizeCode(code);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function focusIndex(index: number) {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
  }

  function setCode(next: string) {
    onCodeChange(normalizeCode(next));
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }

      // Already complete: ignore extra digits (do not rebuild / wipe code).
      if (normalizedCode.length >= OTP_LENGTH) {
        return;
      }

      const next = normalizeCode(normalizedCode + event.key);
      setCode(next);
      focusIndex(Math.min(next.length, OTP_LENGTH - 1));
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      if (isSubmitting || normalizedCode.length === 0) {
        return;
      }

      if (index < normalizedCode.length) {
        const next =
          normalizedCode.slice(0, index) + normalizedCode.slice(index + 1);
        setCode(next);
        focusIndex(Math.min(index, Math.max(0, next.length)));
        return;
      }

      const next = normalizedCode.slice(0, -1);
      setCode(next);
      focusIndex(Math.min(next.length, OTP_LENGTH - 1));
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    const next = normalizeCode(event.clipboardData.getData("text"));
    if (!next) {
      return;
    }
    setCode(next);
    focusIndex(Math.min(next.length, OTP_LENGTH - 1));
  }

  function handleDigitChange(index: number, raw: string) {
    if (isSubmitting) {
      return;
    }
    const cleaned = normalizeCode(raw);
    if (!cleaned) {
      return;
    }

    // Paste / multi-char buffer into one cell.
    if (cleaned.length > 1) {
      setCode(cleaned);
      focusIndex(Math.min(cleaned.length, OTP_LENGTH - 1));
      return;
    }

    // Full code already: ignore onChange from typing over the last cell
    // (would otherwise look like a single "7" and can race into a wipe).
    if (normalizedCode.length >= OTP_LENGTH) {
      return;
    }

    // Replace within the packed run, otherwise append (left-pack).
    const next =
      index < normalizedCode.length
        ? normalizeCode(
            normalizedCode.slice(0, index) +
              cleaned +
              normalizedCode.slice(index + 1),
          )
        : normalizeCode(normalizedCode + cleaned);

    setCode(next);
    focusIndex(Math.min(next.length, OTP_LENGTH - 1));
  }

  return (
    <form className="mt-6 grid gap-5" onSubmit={onSubmit}>
      <div className="grid gap-1.5 text-center">
        <p className="m-0 text-base font-normal leading-relaxed text-muted-foreground">
          {t("auth.codeSentTo")}
        </p>
        <p className="m-0 text-base font-semibold leading-relaxed text-foreground">
          {email}
        </p>
      </div>

      <input
        aria-label={t("auth.codeSentTo")}
        autoComplete="one-time-code"
        className="sr-only"
        data-testid="auth-otp-code"
        inputMode="numeric"
        maxLength={OTP_LENGTH}
        onChange={(event) => {
          const next = normalizeCode(event.target.value);
          // Ignore stale single-key events that would shrink a complete code.
          if (
            normalizedCode.length >= OTP_LENGTH &&
            next.length < OTP_LENGTH
          ) {
            return;
          }
          setCode(next);
          focusIndex(Math.min(next.length, OTP_LENGTH - 1));
        }}
        tabIndex={-1}
        value={normalizedCode}
      />

      <div
        className="flex w-full justify-center gap-2"
        role="group"
        aria-label={t("auth.codeSentTo")}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            aria-label={`${index + 1} / ${OTP_LENGTH}`}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className={classNames(
              "box-border h-14 w-12 shrink-0 rounded-xl border text-center text-lg font-semibold tabular-nums text-foreground outline-none sm:h-16 sm:w-14",
              "focus:border-primary focus:bg-background focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)]",
              digit
                ? "border-primary/55 bg-background"
                : "border-border bg-muted-background",
              error ? "border-danger/70" : null,
            )}
            disabled={isSubmitting}
            inputMode="numeric"
            maxLength={1}
            onChange={(event) => handleDigitChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            pattern="[0-9]*"
            type="text"
            value={digit}
          />
        ))}
      </div>

      {error ? (
        <p className="m-0 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className={primaryTextButtonClassName(
          "w-[328px] max-w-full justify-self-center border-primary bg-primary text-primary-foreground enabled:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)] enabled:active:scale-[0.99] sm:w-[376px]",
        )}
        disabled={isSubmitting || normalizedCode.length !== OTP_LENGTH}
        type="submit"
      >
        {isSubmitting ? t("auth.pleaseWait") : t("auth.verifyCode")}
      </button>

      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
        <span>{t("auth.didNotGetCode")}</span>
        <button
          className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
          disabled={isSubmitting || resendRemainingSeconds > 0}
          onClick={onResend}
          type="button"
        >
          {resendRemainingSeconds > 0
            ? t("auth.resendIn").replace(
                "{seconds}",
                String(resendRemainingSeconds),
              )
            : t("auth.resendCode")}
        </button>
      </div>
    </form>
  );
}
