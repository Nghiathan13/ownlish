import { EVIDENCE_HIGHLIGHT_STORAGE_KEY } from "@/features/tests/run/constants/storageKeys";

export function parseEvidenceHighlightEnabled(raw: string | null) {
  return raw !== "false";
}

export function readEvidenceHighlightEnabled() {
  if (typeof window === "undefined") {
    return true;
  }

  return parseEvidenceHighlightEnabled(
    window.localStorage.getItem(EVIDENCE_HIGHLIGHT_STORAGE_KEY),
  );
}

export function writeEvidenceHighlightEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    EVIDENCE_HIGHLIGHT_STORAGE_KEY,
    String(enabled),
  );
}
