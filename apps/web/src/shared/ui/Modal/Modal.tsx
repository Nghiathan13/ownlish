"use client";

import { ReactNode, useEffect, useId } from "react";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";

type ModalProps = {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
};

export function Modal({ children, description, onClose, title }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="flex max-h-[min(720px,calc(100dvh-2rem))] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-background p-8 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-muted-foreground"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Close"
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-transparent text-foreground transition-colors duration-200 hover:border-foreground"
            onClick={onClose}
            type="button"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
