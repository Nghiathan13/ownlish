"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { Panel } from "@/shared/ui/Panel";
import { TextInput } from "@/shared/ui/TextInput";
import { useAuthSession } from "../hooks/useAuthSession";
import { getAuthValidationError, type AuthMode } from "../lib/authValidation";

type AuthFormProps = {
  redirectTo?: string;
};

export function AuthForm({ redirectTo = "/" }: AuthFormProps) {
  const router = useRouter();
  const { login, register } = useAuthSession();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const validationError = getAuthValidationError({
    email,
    mode,
    name,
    password,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        });
      } else {
        await login({
          email: email.trim(),
          password,
        });
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

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  function clearError() {
    if (error) {
      setError(null);
    }
  }

  return (
    <Panel className="w-[min(420px,100%)]" aria-labelledby="auth-title">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          EngVocab
        </p>
        <h1 id="auth-title" className="mb-3 text-3xl font-bold leading-tight">
          {isRegister ? "Create account" : "Sign in"}
        </h1>
        <p className="text-muted-foreground">
          {isRegister
            ? "Create an account to sync your vocabulary."
            : "Sign in to manage your vocabulary."}
        </p>
      </div>

      <div className="my-6 flex gap-3" aria-label="Auth mode">
        <Button
          type="button"
          variant={mode === "login" ? "primary" : "secondary"}
          onClick={() => switchMode("login")}
          aria-pressed={mode === "login"}
          disabled={isSubmitting}
        >
          Login
        </Button>
        <Button
          type="button"
          variant={mode === "register" ? "primary" : "secondary"}
          onClick={() => switchMode("register")}
          aria-pressed={mode === "register"}
          disabled={isSubmitting}
        >
          Register
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4"
        noValidate
        aria-busy={isSubmitting}
      >
        {isRegister ? (
          <Field label="Name">
            <TextInput
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearError();
              }}
              autoComplete="name"
              maxLength={80}
              disabled={isSubmitting}
            />
          </Field>
        ) : null}

        <Field label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError();
            }}
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
        </Field>

        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError();
            }}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={8}
            required
            disabled={isSubmitting}
          />
        </Field>

        {error ? (
          <p className="m-0 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Please wait..."
            : isRegister
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>
    </Panel>
  );
}
