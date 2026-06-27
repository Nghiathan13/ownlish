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
} from "@/features/shell/lib/bilingualStorage";

type ExitHandler = () => boolean | void | Promise<boolean | void>;
type FinishHandler = () => void | Promise<void>;

export type ImmersiveQuestionNavState = {
  currentQuestionNumber: number;
  totalQuestions: number;
};

type RegisterExitOptions = {
  showBilingualAction?: boolean;
};

type ImmersiveExitContextValue = {
  exit: () => Promise<void>;
  title: string | null;
  showBilingualAction: boolean;
  registerExitHandler: (
    handler: ExitHandler | null,
    title?: string | null,
    backHref?: string | null,
    options?: RegisterExitOptions,
  ) => void;
};

type ImmersiveQuestionNavContextValue = {
  questionNav: ImmersiveQuestionNavState | null;
  registerQuestionNav: (state: ImmersiveQuestionNavState | null) => void;
};

type ImmersiveFinishContextValue = {
  finish: () => Promise<void>;
  title: string | null;
  registerFinishHandler: (
    handler: FinishHandler | null,
    title?: string | null,
  ) => void;
};

type ImmersiveBilingualContextValue = {
  isBilingual: boolean;
  toggleBilingual: () => void;
};

const ImmersiveExitContext = createContext<ImmersiveExitContextValue | null>(
  null,
);

const ImmersiveQuestionNavContext =
  createContext<ImmersiveQuestionNavContextValue | null>(null);

const ImmersiveFinishContext = createContext<ImmersiveFinishContextValue | null>(
  null,
);

const ImmersiveBilingualContext =
  createContext<ImmersiveBilingualContextValue | null>(null);

export function ImmersiveToolbarProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const handlerRef = useRef<ExitHandler | null>(null);
  const backHrefRef = useRef("/");
  const finishHandlerRef = useRef<FinishHandler | null>(null);
  const [exitTitle, setExitTitle] = useState<string | null>(null);
  const [finishTitle, setFinishTitle] = useState<string | null>(null);
  const [showBilingualAction, setShowBilingualAction] = useState(false);
  const [questionNav, setQuestionNav] =
    useState<ImmersiveQuestionNavState | null>(null);
  const [isBilingual, setIsBilingual] = useState(() => readBilingualEnabled());

  const registerExitHandler = useCallback(
    (
      handler: ExitHandler | null,
      title: string | null = null,
      backHref: string | null = null,
      options: RegisterExitOptions = {},
    ) => {
      handlerRef.current = handler;
      setExitTitle(handler ? title : null);
      setShowBilingualAction(Boolean(handler && options.showBilingualAction));
      if (backHref) {
        backHrefRef.current = backHref;
      }
    },
    [],
  );

  const registerQuestionNav = useCallback(
    (state: ImmersiveQuestionNavState | null) => {
      setQuestionNav(state);
    },
    [],
  );

  const registerFinishHandler = useCallback(
    (handler: FinishHandler | null, title: string | null = null) => {
      finishHandlerRef.current = handler;
      setFinishTitle(handler ? title : null);
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
    let shouldNavigate = true;

    try {
      if (handlerRef.current) {
        const result = await handlerRef.current();
        shouldNavigate = result !== false;
      }
    } catch {
      // Exit should not be blocked by best-effort cleanup.
    }

    if (!shouldNavigate) {
      return;
    }

    router.push(backHrefRef.current);
  }, [router]);

  const finish = useCallback(async () => {
    if (finishHandlerRef.current) {
      await finishHandlerRef.current();
    }
  }, []);

  const exitValue = useMemo(
    () => ({
      exit,
      registerExitHandler,
      showBilingualAction,
      title: exitTitle,
    }),
    [exit, exitTitle, registerExitHandler, showBilingualAction],
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
      registerFinishHandler,
      title: finishTitle,
    }),
    [finish, finishTitle, registerFinishHandler],
  );

  const bilingualValue = useMemo(
    () => ({
      isBilingual,
      toggleBilingual,
    }),
    [isBilingual, toggleBilingual],
  );

  return (
    <ImmersiveExitContext.Provider value={exitValue}>
      <ImmersiveQuestionNavContext.Provider value={questionNavValue}>
        <ImmersiveFinishContext.Provider value={finishValue}>
          <ImmersiveBilingualContext.Provider value={bilingualValue}>
            {children}
          </ImmersiveBilingualContext.Provider>
        </ImmersiveFinishContext.Provider>
      </ImmersiveQuestionNavContext.Provider>
    </ImmersiveExitContext.Provider>
  );
}

export function useImmersiveExit() {
  return useContext(ImmersiveExitContext);
}

export function useImmersiveQuestionNav() {
  return useContext(ImmersiveQuestionNavContext);
}

export function useImmersiveBilingual() {
  return useContext(ImmersiveBilingualContext);
}

export function useImmersiveFinish() {
  return useContext(ImmersiveFinishContext);
}

export function useRegisterImmersiveExit(
  handler: ExitHandler | null,
  title: string | null = null,
  backHref: string | null = null,
  options: RegisterExitOptions = {},
) {
  const context = useImmersiveExit();
  const registerExitHandler = context?.registerExitHandler;
  const showBilingualAction = options.showBilingualAction ?? false;

  useEffect(() => {
    if (!registerExitHandler) {
      return;
    }

    registerExitHandler(handler, title, backHref, { showBilingualAction });

    return () => {
      registerExitHandler(null, null, null);
    };
  }, [backHref, handler, registerExitHandler, showBilingualAction, title]);
}

export function useRegisterImmersiveFinish(
  handler: FinishHandler | null,
  title: string | null = null,
) {
  const context = useImmersiveFinish();
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
