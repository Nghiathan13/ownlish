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
  registerExitHandler: (
    handler: ExitHandler | null,
    title?: string | null,
  ) => void;
};

type PracticeQuestionNavContextValue = {
  questionNav: PracticeQuestionNavState | null;
  registerQuestionNav: (state: PracticeQuestionNavState | null) => void;
};

type PracticeBilingualContextValue = {
  isBilingual: boolean;
  toggleBilingual: () => void;
};

const PracticeExitContext = createContext<PracticeExitContextValue | null>(
  null,
);

const PracticeQuestionNavContext =
  createContext<PracticeQuestionNavContextValue | null>(null);

const PracticeBilingualContext =
  createContext<PracticeBilingualContextValue | null>(null);

export function PracticeExitProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const handlerRef = useRef<ExitHandler | null>(null);
  const [practiceTitle, setPracticeTitle] = useState<string | null>(null);
  const [questionNav, setQuestionNav] = useState<PracticeQuestionNavState | null>(
    null,
  );
  const [isBilingual, setIsBilingual] = useState(false);

  const registerExitHandler = useCallback(
    (handler: ExitHandler | null, title: string | null = null) => {
      handlerRef.current = handler;
      setPracticeTitle(handler ? title : null);
      if (!handler) {
        setIsBilingual(false);
      }
    },
    [],
  );

  const registerQuestionNav = useCallback((state: PracticeQuestionNavState | null) => {
    setQuestionNav(state);
  }, []);

  const toggleBilingual = useCallback(() => {
    setIsBilingual((current) => !current);
  }, []);

  const exit = useCallback(async () => {
    try {
      if (handlerRef.current) {
        await handlerRef.current();
      }
    } catch {
      // Exit should not be blocked by best-effort practice cleanup.
    }

    setIsBilingual(false);
    router.push("/tests");
  }, [router]);

  const exitValue = useMemo(
    () => ({
      exit,
      practiceTitle,
      registerExitHandler,
    }),
    [exit, practiceTitle, registerExitHandler],
  );

  const questionNavValue = useMemo(
    () => ({
      questionNav,
      registerQuestionNav,
    }),
    [questionNav, registerQuestionNav],
  );

  const bilingualValue = useMemo(
    () => ({
      isBilingual,
      toggleBilingual,
    }),
    [isBilingual, toggleBilingual],
  );

  return (
    <PracticeExitContext.Provider value={exitValue}>
      <PracticeQuestionNavContext.Provider value={questionNavValue}>
        <PracticeBilingualContext.Provider value={bilingualValue}>
          {children}
        </PracticeBilingualContext.Provider>
      </PracticeQuestionNavContext.Provider>
    </PracticeExitContext.Provider>
  );
}

export function usePracticeExit() {
  return useContext(PracticeExitContext);
}

export function usePracticeQuestionNav() {
  return useContext(PracticeQuestionNavContext);
}

export function usePracticeBilingual() {
  return useContext(PracticeBilingualContext);
}

export function useRegisterPracticeExit(
  handler: ExitHandler | null,
  title: string | null = null,
) {
  const context = usePracticeExit();
  const registerExitHandler = context?.registerExitHandler;

  useEffect(() => {
    if (!registerExitHandler) {
      return;
    }

    registerExitHandler(handler, title);

    return () => {
      registerExitHandler(null, null);
    };
  }, [handler, registerExitHandler, title]);
}
