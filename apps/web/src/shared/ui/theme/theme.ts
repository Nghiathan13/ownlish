export const THEME_STORAGE_KEY = "engvocab-theme";

export type Theme = "dark" | "light" | "system";

export type ResolvedTheme = "dark" | "light";

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStoredTheme(): Theme | null {
  const value = localStorage.getItem(THEME_STORAGE_KEY);

  if (value === "dark" || value === "light" || value === "system") {
    return value;
  }

  return null;
}

export function readThemePreference(): Theme {
  return readStoredTheme() ?? "system";
}

export function resolveTheme(preference: Theme): ResolvedTheme {
  if (preference === "system") {
    return getSystemTheme();
  }

  return preference;
}

export function applyTheme(preference: Theme) {
  const resolved = resolveTheme(preference);

  if (resolved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    return;
  }

  document.documentElement.removeAttribute("data-theme");
}

export const themeInitScript = `(function(){try{var k="engvocab-theme";var s=localStorage.getItem(k);var p=s==="light"||s==="dark"||s==="system"?s:"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.setAttribute("data-theme","dark");else document.documentElement.removeAttribute("data-theme");}catch(e){}})();`;

const themeListeners = new Set<() => void>();

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

export function getThemeServerSnapshot(): Theme {
  return "system";
}

export function getThemeSnapshot(): Theme {
  return readThemePreference();
}

export function subscribeTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (readThemePreference() === "system") {
      applyTheme("system");
    }

    onStoreChange();
  };

  media.addEventListener("change", onSystemChange);
  themeListeners.add(onStoreChange);

  return () => {
    media.removeEventListener("change", onSystemChange);
    themeListeners.delete(onStoreChange);
  };
}

export function setThemePreference(next: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
  notifyThemeListeners();
}
