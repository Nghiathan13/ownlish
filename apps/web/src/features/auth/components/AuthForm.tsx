"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/shared/api/http";
import { classNames } from "@/shared/lib/classNames";
import { primaryTextButtonClassName } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/Panel";
import { PANEL_CARD_CLASS } from "@/shared/ui/layout";
import { TextInput } from "@/shared/ui/TextInput";
import { EmailIcon, PasswordIcon } from "@/shared/ui/icons";
import {
  GoogleSignInButton,
  isGoogleSignInConfigured,
} from "@/features/auth/components/GoogleSignInButton";
import { useAuthSession } from "../hooks/useAuthSession";

type AuthFormProps = {
  redirectTo?: string;
};

type EmailPasswordMode = "login" | "register";

export function AuthForm({ redirectTo = "/" }: AuthFormProps) {
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
          : "Cannot connect to server.",
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
      className={classNames(PANEL_CARD_CLASS, "w-[min(420px,100%)] border-0")}
    >
      <h1 className="text-3xl font-bold leading-tight" id="auth-title">
        Get started with Engvocab
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
                      : "Cannot connect to server.",
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
            <span className="text-sm text-muted-foreground">or</span>
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
            aria-label="Email"
            autoComplete="email"
            className="w-full rounded-md px-4 py-2 pl-11 pr-4"
            onChange={(event) => {
              setEmail(event.target.value);
              clearError();
            }}
            placeholder="Email"
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
            aria-label="Password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="w-full rounded-md px-4 py-2 pl-11 pr-4"
            minLength={mode === "register" ? 8 : undefined}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError();
            }}
            placeholder="Password"
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
          className={primaryTextButtonClassName()}
          disabled={isSubmitting || email.trim().length === 0 || password.length === 0}
          type="submit"
        >
          {isSubmitting ? "Please wait..." : mode === "register" ? "Create" : "Continue"}
        </button>

        {mode === "login" ? (
          <p className="text-center text-sm text-muted-foreground">
            New to Engvocab?{" "}
            <button
              className="cursor-pointer font-medium text-foreground underline underline-offset-4"
              disabled={isSubmitting}
              onClick={() => switchMode("register")}
              type="button"
            >
              Create account
            </button>
          </p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              className="cursor-pointer font-medium text-foreground underline underline-offset-4"
              disabled={isSubmitting}
              onClick={() => switchMode("login")}
              type="button"
            >
              Sign in
            </button>
          </p>
        )}
      </form>
    </Panel>
  );
}
