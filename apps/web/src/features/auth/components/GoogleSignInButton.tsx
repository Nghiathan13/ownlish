"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { classNames } from "@/shared/lib/classNames";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onCredential: (idToken: string) => void | Promise<void>;
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type?: string;
          theme?: string;
          size?: string;
          text?: string;
          width?: number;
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DEFAULT_BUTTON_WIDTH = 360;

function getButtonWidth(containerWidth: number) {
  return Math.max(200, Math.min(Math.floor(containerWidth), 400));
}

export function GoogleSignInButton({
  disabled = false,
  onCredential,
}: GoogleSignInButtonProps) {
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(DEFAULT_BUTTON_WIDTH);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  const handleCredentialResponse = useCallback(
    (response: GoogleCredentialResponse) => {
      if (!response.credential || disabled) {
        return;
      }

      void onCredential(response.credential);
    },
    [disabled, onCredential],
  );

  useEffect(() => {
    const container = buttonHostRef.current;
    if (!container) {
      return;
    }

    const updateWidth = () => {
      setButtonWidth(getButtonWidth(container.offsetWidth || DEFAULT_BUTTON_WIDTH));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isScriptReady || !clientId || !window.google || !buttonHostRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      auto_select: false,
      callback: handleCredentialResponse,
      client_id: clientId,
    });

    buttonHostRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonHostRef.current, {
      size: "large",
      text: "continue_with",
      theme: "outline",
      type: "standard",
      width: buttonWidth,
    });
  }, [buttonWidth, clientId, handleCredentialResponse, isScriptReady]);

  if (!clientId) {
    return null;
  }

  return (
    <>
      <Script
        onLoad={() => setIsScriptReady(true)}
        src={GIS_SCRIPT_SRC}
        strategy="afterInteractive"
      />
      <div
        aria-disabled={disabled || !isScriptReady}
        className={classNames(
          "flex w-full justify-center",
          (disabled || !isScriptReady) && "pointer-events-none opacity-60",
        )}
      >
        <div className="w-full" ref={buttonHostRef} />
      </div>
    </>
  );
}
