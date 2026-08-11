"use client";

import { useCallback, useState } from "react";
import {
  readEvidenceHighlightEnabled,
  writeEvidenceHighlightEnabled,
} from "@/features/tests/run/lib/evidenceHighlightStorage";

export function useEvidenceHighlightPreference() {
  const [enabled, setEnabledState] = useState(readEvidenceHighlightEnabled);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    writeEvidenceHighlightEnabled(next);
  }, []);

  return {
    enabled,
    setEnabled,
  };
}
