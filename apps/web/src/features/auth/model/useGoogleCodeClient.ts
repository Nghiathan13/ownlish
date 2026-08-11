"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GOOGLE_CLIENT_ID,
  isGoogleSignInConfigured,
} from "../config/googleSignIn";
import {
  type GoogleCodeClient,
  isGoogleIdentityReady,
} from "../lib/googleIdentity";

type UseGoogleCodeClientOptions = {
  disabled?: boolean;
  errorMessage: string;
  onCode: (code: string) => void | Promise<void>;
  onError: (message: string) => void;
};

export function useGoogleCodeClient({
  disabled = false,
  errorMessage,
  onCode,
  onError,
}: UseGoogleCodeClientOptions) {
  const codeClientRef = useRef<GoogleCodeClient | null>(null);
  const disabledRef = useRef(disabled);
  const onCodeRef = useRef(onCode);
  const onErrorRef = useRef(onError);
  const errorMessageRef = useRef(errorMessage);
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

  useEffect(() => {
    errorMessageRef.current = errorMessage;
  }, [errorMessage]);

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
          onErrorRef.current(errorMessageRef.current);
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

  return {
    isConfigured: isGoogleSignInConfigured,
    isScriptReady,
    markScriptReady,
    requestCode: () => {
      codeClientRef.current?.requestCode();
    },
  };
}
