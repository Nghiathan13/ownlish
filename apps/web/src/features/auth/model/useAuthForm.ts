"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestEmailOtp } from "@/entities/auth/api/auth";
import { toAuthErrorMessage } from "../lib/toAuthErrorMessage";
import { useAuthSession } from "./authSessionContext";
import { DASHBOARD_MY_ACTIVITY_PATH } from "@/shared/routes/dashboard";
import { useT } from "@/shared/providers/LocaleProvider";

export type AuthStep = "email" | "otp" | "profile";

export type UseAuthFormOptions = {
  redirectTo?: string;
};

export function useAuthForm({
  redirectTo = DASHBOARD_MY_ACTIVITY_PATH,
}: UseAuthFormOptions = {}) {
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
      setError(toAuthErrorMessage(caughtError, t("auth.cannotConnect")));
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
      setError(toAuthErrorMessage(caughtError, t("auth.cannotConnect")));
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
      setError(toAuthErrorMessage(caughtError, t("auth.cannotConnect")));
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

  function updateEmail(value: string) {
    setEmail(value);
    clearError();
  }

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    clearError();
  }

  function updateName(value: string) {
    setName(value);
    clearError();
  }

  async function handleGoogleCode(googleCode: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      await googleLogin({ code: googleCode });
      router.replace(redirectTo);
    } catch (caughtError) {
      setError(toAuthErrorMessage(caughtError, t("auth.cannotConnect")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleError(message: string) {
    setError(message);
  }

  function handleResendCode() {
    setError(null);
    setIsSubmitting(true);
    void requestCode()
      .catch((caughtError) => {
        setError(toAuthErrorMessage(caughtError, t("auth.cannotConnect")));
      })
      .finally(() => setIsSubmitting(false));
  }

  return {
    step,
    email,
    code,
    name,
    error,
    isSubmitting,
    resendRemainingSeconds,
    updateEmail,
    updateCode,
    updateName,
    handleEmailSubmit,
    handleOtpSubmit,
    handleProfileSubmit,
    changeEmail,
    handleResendCode,
    handleGoogleCode,
    handleGoogleError,
  };
}
