"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleSignInButton,
  isGoogleSignInConfigured,
} from "@/features/auth/components/GoogleSignInButton";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { ApiError } from "@/shared/api/http";
import { useT } from "@/shared/providers/LocaleProvider";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { EmailIcon, PasswordIcon } from "@/shared/ui/icons";
import { Panel } from "@/shared/ui/Panel";
import { TextInput } from "@/shared/ui/TextInput";

type AuthFormProps = {
  redirectTo?: string;
};

type EmailPasswordMode = "login" | "register";

export function AuthForm({ redirectTo = "/" }: AuthFormProps) {
  const t = useT();
  const router = useRouter();
  const { googleLogin, login, register } = useAuthSession();
  const [mode, setMode] = useState<EmailPasswordMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearError() {
    if (error) {
      setError(null);
    }
  }

  async function handleEmailPasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const credentials = {
        email: email.trim(),
        password,
      };

      if (mode === "register") {
        await register(credentials);
      } else {
        await login(credentials);
      }

      router.replace(redirectTo);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : t("auth.cannotConnect"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: EmailPasswordMode) {
    setMode(nextMode);
    setPassword("");
    setError(null);
  }

  return (
    <Panel
      aria-labelledby="auth-title"
      className="w-[min(420px,100%)]"
    >
      <h1 className="text-3xl font-bold leading-tight" id="auth-title">
        {mode === "register" ? t("auth.registerTitle") : t("auth.loginTitle")}
      </h1>

      {isGoogleSignInConfigured ? (
        <>
          <div className="mt-6">
            <GoogleSignInButton
              disabled={isSubmitting}
              onCode={async (code) => {
                setError(null);
                setIsSubmitting(true);

                try {
                  await googleLogin({ code });
                  router.replace(redirectTo);
                } catch (caughtError) {
                  setError(
                    caughtError instanceof ApiError
                      ? caughtError.message
                      : t("auth.cannotConnect"),
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}
              onError={setError}
            />
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">{t("auth.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form className="grid gap-4" onSubmit={handleEmailPasswordSubmit}>
        <div className="relative">
          <EmailIcon
            data-testid="email-icon"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          />
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

        <div className="relative">
          <PasswordIcon
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
            data-testid="password-icon"
          />
          <TextInput
            aria-label={t("auth.password")}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="w-full rounded-md px-4 py-2 pl-11 pr-4 focus:border-[#1F48DA]"
            minLength={mode === "register" ? 8 : undefined}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError();
            }}
            placeholder={t("auth.password")}
            required
            type="password"
            value={password}
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
          disabled={isSubmitting || email.trim().length === 0 || password.length === 0}
          type="submit"
        >
          {isSubmitting
            ? t("auth.pleaseWait")
            : mode === "register"
              ? t("auth.create")
              : t("auth.continue")}
        </button>

        {mode === "login" ? (
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.newToEngvocab")}{" "}
            <button
              className="cursor-pointer font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-foreground"
              disabled={isSubmitting}
              onClick={() => switchMode("register")}
              type="button"
            >
              {t("auth.createAccount")}
            </button>
          </p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.alreadyHaveAccount")}{" "}
            <button
              className="cursor-pointer font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-foreground"
              disabled={isSubmitting}
              onClick={() => switchMode("login")}
              type="button"
            >
              {t("auth.signIn")}
            </button>
          </p>
        )}
      </form>
    </Panel>
  );
}
