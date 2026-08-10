"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleSignInButton,
  isGoogleSignInConfigured,
} from "@/features/auth/components/GoogleSignInButton";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { requestEmailOtp } from "@/entities/auth/api/auth";
import { DASHBOARD_MY_ACTIVITY_PATH } from "@/features/home/lib/dashboardPaths";
import { ApiError } from "@/shared/api/http";
import { useT } from "@/shared/providers/LocaleProvider";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { EmailIcon } from "@/shared/ui/icons";
import { Panel } from "@/shared/ui/Panel";
import { TextInput } from "@/shared/ui/TextInput";

type AuthFormProps = {
  redirectTo?: string;
};

type AuthStep = "email" | "otp" | "profile";

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");

  if (!domain || !localPart) {
    return email;
  }

  return `${localPart.slice(0, 2)}${"•".repeat(
    Math.max(1, localPart.length - 2),
  )}@${domain}`;
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function AuthForm({
  redirectTo = DASHBOARD_MY_ACTIVITY_PATH,
}: AuthFormProps) {
  const t = useT();
  const router = useRouter();
  const { completeEmailOtpProfile, googleLogin, verifyEmailOtp } =
    useAuthSession();
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [enrollmentToken, setEnrollmentToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(
    null,
  );
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step !== "otp" || !resendAvailableAt || resendAvailableAt <= Date.now()) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt, step]);

  const resendRemainingSeconds = resendAvailableAt
    ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1_000))
    : 0;

  function clearError() {
    if (error) {
      setError(null);
    }
  }

  async function requestCode() {
    const response = await requestEmailOtp({ email: email.trim() });
    setChallengeId(response.challengeId);
    setCode("");
    setResendAvailableAt(new Date(response.resendAvailableAt).getTime());
    setNow(Date.now());
    setStep("otp");
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await requestCode();
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, t("auth.cannotConnect")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeId) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await verifyEmailOtp({ challengeId, code });
      if ("status" in response) {
        setEnrollmentToken(response.enrollmentToken);
        setStep("profile");
        return;
      }

      router.replace(redirectTo);
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, t("auth.cannotConnect")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollmentToken) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await completeEmailOtpProfile({ enrollmentToken, name: name.trim() });
      router.replace(redirectTo);
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, t("auth.cannotConnect")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeEmail() {
    setChallengeId(null);
    setCode("");
    setEnrollmentToken(null);
    setError(null);
    setStep("email");
  }

  const isOtpStep = step === "otp";
  const isProfileStep = step === "profile";

  return (
    <Panel aria-labelledby="auth-title" className="w-[min(420px,100%)]">
      <h1 className="text-3xl font-bold leading-tight" id="auth-title">
        {isOtpStep
          ? t("auth.checkYourEmail")
          : isProfileStep
            ? t("auth.finishProfile")
            : t("auth.loginTitle")}
      </h1>

      {step === "email" ? (
        <form className="mt-6 grid gap-4" onSubmit={handleEmailSubmit}>
          <div className="relative">
            <EmailIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
            <TextInput
              aria-label={t("auth.email")}
              autoComplete="email"
              className="w-full rounded-md px-4 py-2 pl-11 pr-4 focus:border-[#1F48DA]"
              onChange={(event) => {
                setEmail(event.target.value);
                clearError();
              }}
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
              "border-[#1F48DA] bg-[#1F48DA] text-white hover:[box-shadow:inset_0_0_0_9999px_rgba(255,255,255,0.12)]",
            )}
            disabled={isSubmitting || email.trim().length === 0}
            type="submit"
          >
            {isSubmitting ? t("auth.pleaseWait") : t("auth.continue")}
          </button>
        </form>
      ) : null}

      {isOtpStep ? (
        <form className="mt-6 grid gap-4" onSubmit={handleOtpSubmit}>
          <p className="m-0 text-sm text-muted-foreground">
            {t("auth.codeSentTo")} <strong className="text-foreground">{maskEmail(email)}</strong>
          </p>
          <TextInput
            aria-label={t("auth.otpCode")}
            autoComplete="one-time-code"
            className="w-full rounded-md px-4 py-2 text-center text-lg tracking-[0.35em] focus:border-[#1F48DA]"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              clearError();
            }}
            placeholder="000000"
            required
            value={code}
          />

          {error ? (
            <p className="m-0 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className={primaryTextButtonClassName(
              "border-[#1F48DA] bg-[#1F48DA] text-white hover:[box-shadow:inset_0_0_0_9999px_rgba(255,255,255,0.12)]",
            )}
            disabled={isSubmitting || code.length !== 6}
            type="submit"
          >
            {isSubmitting ? t("auth.pleaseWait") : t("auth.verifyCode")}
          </button>

          <div className="flex items-center justify-between gap-3 text-sm">
            <button
              className="cursor-pointer text-muted-foreground underline underline-offset-4 hover:text-foreground"
              disabled={isSubmitting}
              onClick={changeEmail}
              type="button"
            >
              {t("auth.changeEmail")}
            </button>
            <button
              className="cursor-pointer text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
              disabled={isSubmitting || resendRemainingSeconds > 0}
              onClick={() => {
                setError(null);
                setIsSubmitting(true);
                void requestCode()
                  .catch((caughtError) => {
                    setError(toErrorMessage(caughtError, t("auth.cannotConnect")));
                  })
                  .finally(() => setIsSubmitting(false));
              }}
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
      ) : null}

      {isProfileStep ? (
        <form className="mt-6 grid gap-4" onSubmit={handleProfileSubmit}>
          <p className="m-0 text-sm text-muted-foreground">
            {t("auth.nameDescription")}
          </p>
          <TextInput
            aria-label={t("auth.name")}
            autoComplete="name"
            className="w-full rounded-md px-4 py-2 focus:border-[#1F48DA]"
            maxLength={80}
            onChange={(event) => {
              setName(event.target.value);
              clearError();
            }}
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
              "border-[#1F48DA] bg-[#1F48DA] text-white hover:[box-shadow:inset_0_0_0_9999px_rgba(255,255,255,0.12)]",
            )}
            disabled={isSubmitting || name.trim().length === 0}
            type="submit"
          >
            {isSubmitting ? t("auth.pleaseWait") : t("auth.finish")}
          </button>
        </form>
      ) : null}

      {step === "email" && isGoogleSignInConfigured ? (
        <>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">{t("auth.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton
            disabled={isSubmitting}
            onCode={async (googleCode) => {
              setError(null);
              setIsSubmitting(true);
              try {
                await googleLogin({ code: googleCode });
                router.replace(redirectTo);
              } catch (caughtError) {
                setError(toErrorMessage(caughtError, t("auth.cannotConnect")));
              } finally {
                setIsSubmitting(false);
              }
            }}
            onError={setError}
          />
        </>
      ) : null}
    </Panel>
  );
}
