"use client";

import Image from "next/image";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onCode: (code: string) => void | Promise<void>;
  onError: (message: string) => void;
};

type GoogleCodeResponse = {
  code?: string;
};

type GoogleCodeClient = {
  requestCode: () => void;
};

type GoogleIdentityApi = {
  accounts: {
    oauth2: {
      initCodeClient: (config: {
        callback: (response: GoogleCodeResponse) => void;
        client_id: string;
        error_callback: () => void;
        scope: string;
        ux_mode: "popup";
      }) => GoogleCodeClient;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const isGoogleSignInConfigured = Boolean(GOOGLE_CLIENT_ID);

function isGoogleIdentityReady() {
  return Boolean(window.google?.accounts?.oauth2?.initCodeClient);
}

export function GoogleSignInButton({
  disabled = false,
  onCode,
  onError,
}: GoogleSignInButtonProps) {
  const codeClientRef = useRef<GoogleCodeClient | null>(null);
  const disabledRef = useRef(disabled);
  const onCodeRef = useRef(onCode);
  const onErrorRef = useRef(onError);
  const [isScriptReady, setIsScriptReady] = useState(
    () => typeof window !== "undefined" && isGoogleIdentityReady(),
  );

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const markScriptReady = useCallback(() => {
    if (isGoogleIdentityReady()) {
      setIsScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isScriptReady || !isGoogleSignInConfigured || !isGoogleIdentityReady()) {
      return;
    }

    const client = window.google!.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: (response) => {
        if (!response.code || disabledRef.current) {
          return;
        }

        void onCodeRef.current(response.code);
      },
      error_callback: () => {
        if (!disabledRef.current) {
          onErrorRef.current("Google sign-in could not be completed. Please try again.");
        }
      },
    });

    codeClientRef.current = client;

    return () => {
      if (codeClientRef.current === client) {
        codeClientRef.current = null;
      }
    };
  }, [isScriptReady]);

  if (!isGoogleSignInConfigured) {
    return null;
  }

  const isDisabled = disabled || !isScriptReady;

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
          "w-full gap-3 hover:border-border hover:bg-hover-overlay active:translate-y-px",
        )}
        disabled={isDisabled}
        onClick={() => codeClientRef.current?.requestCode()}
        type="button"
      >
        <Image alt="" aria-hidden height={18} src="/google.svg" width={18} />
        {isScriptReady ? "Continue with Google" : "Loading Google..."}
      </button>
    </>
  );
}
