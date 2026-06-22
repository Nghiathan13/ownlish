import { BILINGUAL_STORAGE_KEY } from "@/features/tests/run/constants/storageKeys";

export function parseBilingualEnabled(raw: string | null) {
  return raw === "true";
}

export function readBilingualEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return parseBilingualEnabled(
    window.localStorage.getItem(BILINGUAL_STORAGE_KEY),
  );
}

export function writeBilingualEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(BILINGUAL_STORAGE_KEY, String(enabled));
}
