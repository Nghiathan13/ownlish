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
import {
  readBilingualEnabled,
  writeBilingualEnabled,
} from "@/features/tests/run/lib/bilingualStorage";
import { getTestsListPathFromSearchParams } from "@/features/tests/shared/constants/toeicYears";

type ExitHandler = () => void | Promise<void>;
type FinishHandler = () => void | Promise<void>;

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

type PracticeFinishContextValue = {
  finish: () => Promise<void>;
  mockTitle: string | null;
  registerFinishHandler: (
    handler: FinishHandler | null,
    title?: string | null,
  ) => void;
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

const PracticeFinishContext = createContext<PracticeFinishContextValue | null>(
  null,
);

const PracticeBilingualContext =
  createContext<PracticeBilingualContextValue | null>(null);

export function PracticeExitProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const handlerRef = useRef<ExitHandler | null>(null);
  const finishHandlerRef = useRef<FinishHandler | null>(null);
  const [practiceTitle, setPracticeTitle] = useState<string | null>(null);
  const [mockTitle, setMockTitle] = useState<string | null>(null);
  const [questionNav, setQuestionNav] = useState<PracticeQuestionNavState | null>(
    null,
  );
  const [isBilingual, setIsBilingual] = useState(() => readBilingualEnabled());

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

  const registerFinishHandler = useCallback(
    (handler: FinishHandler | null, title: string | null = null) => {
      finishHandlerRef.current = handler;
      setMockTitle(handler ? title : null);
    },
    [],
  );

  const toggleBilingual = useCallback(() => {
    setIsBilingual((current) => {
      const next = !current;
      writeBilingualEnabled(next);
      return next;
    });
  }, []);

  const exit = useCallback(async () => {
    try {
      if (handlerRef.current) {
        await handlerRef.current();
      }
    } catch {
      // Exit should not be blocked by best-effort practice cleanup.
    }

    router.push(
      getTestsListPathFromSearchParams(new URLSearchParams(window.location.search)),
    );
  }, [router]);

  const finish = useCallback(async () => {
    if (finishHandlerRef.current) {
      await finishHandlerRef.current();
    }
  }, []);

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

  const finishValue = useMemo(
    () => ({
      finish,
      mockTitle,
      registerFinishHandler,
    }),
    [finish, mockTitle, registerFinishHandler],
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
        <PracticeFinishContext.Provider value={finishValue}>
          <PracticeBilingualContext.Provider value={bilingualValue}>
            {children}
          </PracticeBilingualContext.Provider>
        </PracticeFinishContext.Provider>
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

export function usePracticeFinish() {
  return useContext(PracticeFinishContext);
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

export function useRegisterPracticeFinish(
  handler: FinishHandler | null,
  title: string | null = null,
) {
  const context = usePracticeFinish();
  const registerFinishHandler = context?.registerFinishHandler;

  useEffect(() => {
    if (!registerFinishHandler) {
      return;
    }

    registerFinishHandler(handler, title);

    return () => {
      registerFinishHandler(null, null);
    };
  }, [handler, registerFinishHandler, title]);
}
