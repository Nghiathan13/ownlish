"use client";

import { useLayoutEffect, useRef } from "react";

const TYPING_INPUT_MAX_WIDTH = 360;
const TYPING_UNDERLINE_EXTRA_WIDTH = 28;
const TYPING_FIELD_VIEWPORT_MARGIN = 96;

type UseTypingFieldParams = {
  typedAnswer: string;
  enabled: boolean;
};

export function useTypingField({ typedAnswer, enabled }: UseTypingFieldParams) {
  const typingInputRef = useRef<HTMLInputElement>(null);
  const typingMeasureRef = useRef<HTMLSpanElement>(null);
  const typingFieldRef = useRef<HTMLDivElement>(null);

  const typingFieldText = typedAnswer || "Type the word";

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    const measure = typingMeasureRef.current;
    const field = typingFieldRef.current;
    if (!measure || !field) {
      return;
    }

    const measuredWidth =
      Math.ceil(measure.getBoundingClientRect().width) +
      TYPING_UNDERLINE_EXTRA_WIDTH +
      16;
    const maxFieldWidth = Math.min(
      TYPING_INPUT_MAX_WIDTH + TYPING_UNDERLINE_EXTRA_WIDTH,
      window.innerWidth - TYPING_FIELD_VIEWPORT_MARGIN,
    );
    const nextWidth = Math.min(measuredWidth, maxFieldWidth);

    // Set width on the element directly so CSS can interpolate without a
    // second React render interrupting the transition.
    field.style.width = `${nextWidth}px`;

    const animationFrame = window.requestAnimationFrame(() => {
      if (measuredWidth <= maxFieldWidth) {
        typingInputRef.current?.scrollTo({ left: 0 });
      }
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [enabled, typingFieldText]);

  return {
    typingInputRef,
    typingMeasureRef,
    typingFieldRef,
    typingFieldText,
  };
}
