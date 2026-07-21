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

type RegisterExitOptions = {
  showBilingualAction?: boolean;
};

type RegisterFinishOptions = {
  disabled?: boolean;
  isPending?: boolean;
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

type ImmersiveFinishContextValue = {
  disabled: boolean;
  finish: () => Promise<void>;
  isPending: boolean;
  title: string | null;
  registerFinishHandler: (
    handler: FinishHandler | null,
    title?: string | null,
    options?: RegisterFinishOptions,
  ) => void;
};

type ImmersiveBilingualContextValue = {
  isBilingual: boolean;
  toggleBilingual: () => void;
};

const ImmersiveExitContext = createContext<ImmersiveExitContextValue | null>(
  null,
);

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
  const finishDisabledRef = useRef(false);
  const [exitTitle, setExitTitle] = useState<string | null>(null);
  const [finishTitle, setFinishTitle] = useState<string | null>(null);
  const [isFinishDisabled, setIsFinishDisabled] = useState(false);
  const [isFinishPending, setIsFinishPending] = useState(false);
  const [showBilingualAction, setShowBilingualAction] = useState(false);
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

  const registerFinishHandler = useCallback(
    (
      handler: FinishHandler | null,
      title: string | null = null,
      options: RegisterFinishOptions = {},
    ) => {
      const disabled = Boolean(handler && options.disabled);
      finishHandlerRef.current = handler;
      finishDisabledRef.current = disabled;
      setFinishTitle(handler ? title : null);
      setIsFinishDisabled(disabled);
      setIsFinishPending(Boolean(handler && options.isPending));
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
    if (finishHandlerRef.current && !finishDisabledRef.current) {
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

  const finishValue = useMemo(
    () => ({
      disabled: isFinishDisabled,
      finish,
      isPending: isFinishPending,
      registerFinishHandler,
      title: finishTitle,
    }),
    [
      finish,
      finishTitle,
      isFinishDisabled,
      isFinishPending,
      registerFinishHandler,
    ],
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
      <ImmersiveFinishContext.Provider value={finishValue}>
        <ImmersiveBilingualContext.Provider value={bilingualValue}>
          {children}
        </ImmersiveBilingualContext.Provider>
      </ImmersiveFinishContext.Provider>
    </ImmersiveExitContext.Provider>
  );
}

export function useImmersiveExit() {
  return useContext(ImmersiveExitContext);
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
  options: RegisterFinishOptions = {},
) {
  const context = useImmersiveFinish();
  const registerFinishHandler = context?.registerFinishHandler;
  const disabled = options.disabled ?? false;
  const isPending = options.isPending ?? false;

  useEffect(() => {
    if (!registerFinishHandler) {
      return;
    }

    registerFinishHandler(handler, title, { disabled, isPending });

    return () => {
      registerFinishHandler(null, null, {});
    };
  }, [disabled, handler, isPending, registerFinishHandler, title]);
}
