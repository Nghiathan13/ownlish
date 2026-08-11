"use client";

import Image from "next/image";
import Script from "next/script";
import { GIS_SCRIPT_SRC } from "../config/googleSignIn";
import { useGoogleCodeClient } from "../model/useGoogleCodeClient";
import { useT } from "@/shared/lib/providers";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

export { isGoogleSignInConfigured } from "../config/googleSignIn";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onCode: (code: string) => void | Promise<void>;
  onError: (message: string) => void;
};

export function GoogleSignInButton({
  disabled = false,
  onCode,
  onError,
}: GoogleSignInButtonProps) {
  const t = useT();
  const { isConfigured, isScriptReady, markScriptReady, requestCode } =
    useGoogleCodeClient({
      disabled,
      errorMessage: t("auth.googleSignInFailed"),
      onCode,
      onError,
    });

  if (!isConfigured) {
    return null;
  }

  return (
    <>
      <Script
        onLoad={markScriptReady}
        onReady={markScriptReady}
        src={GIS_SCRIPT_SRC}
        strategy="afterInteractive"
      />
      <button
        className={secondaryTextButtonClassName(
          "w-full gap-3 hover:border-border hover:bg-hover-overlay",
        )}
        disabled={disabled || !isScriptReady}
        onClick={requestCode}
        type="button"
      >
        <Image alt="" aria-hidden height={18} src="/google.svg" width={18} />
        {isScriptReady ? t("auth.continueWithGoogle") : t("auth.loadingGoogle")}
      </button>
    </>
  );
}
