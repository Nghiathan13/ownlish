"use client";

import { FormEmailStep } from "./FormEmailStep";
import { FormOtpStep } from "./FormOtpStep";
import { FormProfileStep } from "./FormProfileStep";
import { useAuthForm } from "../model/useAuthForm";
import { useT } from "@/shared/providers/LocaleProvider";
import { Panel } from "@/shared/ui/Panel";

type FormProps = {
  redirectTo?: string;
};

export function Form({ redirectTo }: FormProps) {
  const t = useT();
  const form = useAuthForm({ redirectTo });

  const title =
    form.step === "otp"
      ? t("auth.checkYourEmail")
      : form.step === "profile"
        ? t("auth.finishProfile")
        : t("auth.loginTitle");

  return (
    <Panel aria-labelledby="auth-title" className="w-[min(400px,100%)]">
      <h1
        className="text-center text-3xl font-bold leading-tight"
        id="auth-title"
      >
        {title}
      </h1>

      {form.step === "email" ? (
        <FormEmailStep
          email={form.email}
          error={form.error}
          isSubmitting={form.isSubmitting}
          onEmailChange={form.updateEmail}
          onGoogleCode={form.handleGoogleCode}
          onGoogleError={form.handleGoogleError}
          onSubmit={form.handleEmailSubmit}
        />
      ) : null}

      {form.step === "otp" ? (
        <FormOtpStep
          code={form.code}
          email={form.email}
          error={form.error}
          isSubmitting={form.isSubmitting}
          onCodeChange={form.updateCode}
          onResend={form.handleResendCode}
          onSubmit={form.handleOtpSubmit}
          resendRemainingSeconds={form.resendRemainingSeconds}
        />
      ) : null}

      {form.step === "profile" ? (
        <FormProfileStep
          error={form.error}
          isSubmitting={form.isSubmitting}
          name={form.name}
          onNameChange={form.updateName}
          onSubmit={form.handleProfileSubmit}
        />
      ) : null}
    </Panel>
  );
}
