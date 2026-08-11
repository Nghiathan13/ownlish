"use client";

import { useCallback, useState } from "react";
import type { ToeicQuestionGroup } from "@/entities/toeic-runtime";
import { getLocaleSnapshot } from "@/shared/i18n";
import { translate } from "@/shared/i18n";

type UseSignedMediaParams = {
  group: ToeicQuestionGroup | null;
};

export function useSignedMedia({ group }: UseSignedMediaParams) {
  const [mediaError, setMediaError] = useState<string | null>(null);
  const handleMediaError = useCallback(() => {
    setMediaError(translate(getLocaleSnapshot(), "tests.cannotLoadMedia"));
  }, []);

  return {
    audioUrl: group?.audioUrl ?? null,
    imageUrl: group?.imageUrl ?? null,
    mediaError,
    handleMediaError,
    refreshMedia: async () => undefined,
  };
}
