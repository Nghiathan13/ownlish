"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type ExitHandler = () => void | Promise<void>;

type PracticeExitContextValue = {
  exit: () => Promise<void>;
  registerExitHandler: (handler: ExitHandler | null) => void;
};

const PracticeExitContext = createContext<PracticeExitContextValue | null>(
  null,
);

export function PracticeExitProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const handlerRef = useRef<ExitHandler | null>(null);

  const registerExitHandler = useCallback((handler: ExitHandler | null) => {
    handlerRef.current = handler;
  }, []);

  const exit = useCallback(async () => {
    if (handlerRef.current) {
      await handlerRef.current();
      return;
    }

    router.push("/tests");
  }, [router]);

  const value = useMemo(
    () => ({ exit, registerExitHandler }),
    [exit, registerExitHandler],
  );

  return (
    <PracticeExitContext.Provider value={value}>
      {children}
    </PracticeExitContext.Provider>
  );
}

export function usePracticeExit() {
  return useContext(PracticeExitContext);
}

export function useRegisterPracticeExit(handler: ExitHandler | null) {
  const context = usePracticeExit();

  useEffect(() => {
    if (!context) {
      return;
    }

    context.registerExitHandler(handler);

    return () => {
      context.registerExitHandler(null);
    };
  }, [context, handler]);
}
