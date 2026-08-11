"use client";

import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
} from "react";
import type { AuthUser } from "@/entities/auth/@x/session";
import {
  bootstrapClientSession,
  clearClientSession,
  discardClientAccessToken,
  setSessionInvalidHandler,
} from "@/entities/session/model/accessTokenManager";
import type { AuthStatus } from "./authStatus";
import {
  createAuthSessionChannel,
  isAuthSessionMessage,
} from "./authSessionChannel";
import { isUnauthorizedError } from "@/shared/api/http";

const BOOTSTRAP_RETRY_DELAY_MS = 1_000;

type UseAuthSessionBootstrapOptions = {
  sessionChannelRef: MutableRefObject<BroadcastChannel | null>;
  setStatus: Dispatch<SetStateAction<AuthStatus>>;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
};

export function useAuthSessionBootstrap({
  sessionChannelRef,
  setStatus,
  setUser,
}: UseAuthSessionBootstrapOptions) {
  useEffect(() => {
    setSessionInvalidHandler(() => {
      setUser(null);
      setStatus("guest");
    });

    return () => {
      setSessionInvalidHandler(null);
    };
  }, [setStatus, setUser]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | null = null;
    let syncVersion = 0;

    function clearRetryTimer() {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    }

    async function bootstrapSession(version: number) {
      try {
        const session = await bootstrapClientSession();

        if (!cancelled && version === syncVersion) {
          setUser(session.user);
          setStatus("authenticated");
        }
      } catch (error) {
        if (!cancelled && version === syncVersion) {
          if (isUnauthorizedError(error)) {
            clearClientSession();
          } else {
            retryTimer = window.setTimeout(() => {
              void bootstrapSession(version);
            }, BOOTSTRAP_RETRY_DELAY_MS);
          }
        }
      }
    }

    function synchronizeSession() {
      syncVersion += 1;
      clearRetryTimer();
      discardClientAccessToken();
      setUser(null);
      setStatus("loading");
      void bootstrapSession(syncVersion);
    }

    function synchronizeSignedOutSession() {
      syncVersion += 1;
      clearRetryTimer();
      discardClientAccessToken();
      setUser(null);
      setStatus("guest");
    }

    const channel = createAuthSessionChannel();

    if (channel) {
      const handleMessage = (event: MessageEvent<unknown>) => {
        if (!isAuthSessionMessage(event.data)) {
          return;
        }

        if (event.data.type === "session-changed") {
          synchronizeSession();
          return;
        }

        synchronizeSignedOutSession();
      };

      channel.addEventListener("message", handleMessage);
      sessionChannelRef.current = channel;

      void bootstrapSession(syncVersion);

      return () => {
        cancelled = true;
        clearRetryTimer();
        channel.removeEventListener("message", handleMessage);
        channel.close();
        if (sessionChannelRef.current === channel) {
          sessionChannelRef.current = null;
        }
      };
    }

    void bootstrapSession(syncVersion);

    return () => {
      cancelled = true;
      clearRetryTimer();
    };
  }, [sessionChannelRef, setStatus, setUser]);
}
