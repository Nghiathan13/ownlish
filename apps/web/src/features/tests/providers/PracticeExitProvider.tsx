"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type ExitHandler = () => void | Promise<void>;

export type PracticeQuestionNavState = {
  currentQuestionNumber: number;
  totalQuestions: number;
};

type PracticeExitContextValue = {
  exit: () => Promise<void>;
  practiceTitle: string | null;
  questionNav: PracticeQuestionNavState | null;
  registerExitHandler: (
    handler: ExitHandler | null,
    title?: string | null,
  ) => void;
  registerQuestionNav: (state: PracticeQuestionNavState | null) => void;
};

const PracticeExitContext = createContext<PracticeExitContextValue | null>(
  null,
);

export function PracticeExitProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const handlerRef = useRef<ExitHandler | null>(null);
  const [practiceTitle, setPracticeTitle] = useState<string | null>(null);
  const [questionNav, setQuestionNav] = useState<PracticeQuestionNavState | null>(
    null,
  );

  const registerExitHandler = useCallback(
    (handler: ExitHandler | null, title: string | null = null) => {
      handlerRef.current = handler;
      setPracticeTitle(handler ? title : null);
    },
    [],
  );

  const registerQuestionNav = useCallback((state: PracticeQuestionNavState | null) => {
    setQuestionNav(state);
  }, []);

  const exit = useCallback(async () => {
    if (handlerRef.current) {
      await handlerRef.current();
      return;
    }

    router.push("/tests");
  }, [router]);

  const value = useMemo(
    () => ({
      exit,
      practiceTitle,
      questionNav,
      registerExitHandler,
      registerQuestionNav,
    }),
    [exit, practiceTitle, questionNav, registerExitHandler, registerQuestionNav],
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

export function useRegisterPracticeExit(
  handler: ExitHandler | null,
  title: string | null = null,
) {
  const context = usePracticeExit();

  useEffect(() => {
    if (!context) {
      return;
    }

    context.registerExitHandler(handler, title);

    return () => {
      context.registerExitHandler(null, null);
    };
  }, [context, handler, title]);
}
