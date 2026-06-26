"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
/** GIS `size: "large"` standard button height */
const GIS_BUTTON_MIN_HEIGHT_PX = 40;

function getButtonWidth(containerWidth: number) {
  return Math.max(200, Math.min(Math.floor(containerWidth), 400));
}

function isGoogleIdentityReady() {
  return Boolean(window.google?.accounts?.id);
}

export function GoogleSignInButton({
  disabled = false,
  onCredential,
}: GoogleSignInButtonProps) {
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const disabledRef = useRef(disabled);
  const onCredentialRef = useRef(onCredential);
  const buttonWidthRef = useRef<number | null>(null);
  const renderedWidthRef = useRef<number | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(
    () => typeof window !== "undefined" && isGoogleIdentityReady(),
  );
  const [buttonWidth, setButtonWidth] = useState<number | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  const markScriptReady = useCallback(() => {
    if (isGoogleIdentityReady()) {
      setIsScriptReady(true);
    }
  }, []);

  useLayoutEffect(() => {
    const container = buttonHostRef.current;
    if (!container) {
      return;
    }

    const applyMeasuredWidth = () => {
      const nextWidth = getButtonWidth(
        container.offsetWidth || DEFAULT_BUTTON_WIDTH,
      );

      if (nextWidth === buttonWidthRef.current) {
        return;
      }

      buttonWidthRef.current = nextWidth;
      setButtonWidth(nextWidth);
    };

    applyMeasuredWidth();

    const observer = new ResizeObserver(() => {
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }

      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = null;
        applyMeasuredWidth();
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isScriptReady || !clientId || !isGoogleIdentityReady()) {
      return;
    }

    window.google!.accounts.id.initialize({
      auto_select: false,
      client_id: clientId,
      callback: (response) => {
        if (!response.credential || disabledRef.current) {
          return;
        }

        void onCredentialRef.current(response.credential);
      },
    });
  }, [clientId, isScriptReady]);

  useEffect(() => {
    const host = buttonHostRef.current;

    if (
      !isScriptReady ||
      !clientId ||
      !isGoogleIdentityReady() ||
      !host ||
      buttonWidth === null
    ) {
      return;
    }

    if (renderedWidthRef.current === buttonWidth) {
      return;
    }

    host.innerHTML = "";
    window.google!.accounts.id.renderButton(host, {
      size: "large",
      text: "continue_with",
      theme: "outline",
      type: "standard",
      width: buttonWidth,
    });
    renderedWidthRef.current = buttonWidth;
  }, [buttonWidth, clientId, isScriptReady]);

  if (!clientId) {
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
      <div
        aria-disabled={disabled}
        className={classNames(
          "flex w-full justify-center",
          disabled && "pointer-events-none opacity-60",
        )}
        style={{ minHeight: GIS_BUTTON_MIN_HEIGHT_PX }}
      >
        <div className="w-full" ref={buttonHostRef} />
      </div>
    </>
  );
}
