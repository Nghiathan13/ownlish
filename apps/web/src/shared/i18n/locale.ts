export const LOCALE_STORAGE_KEY = "engvocab-locale";

export type Locale = "en" | "vi";

export function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "vi";
}

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(value) ? value : null;
}

export function readLocalePreference(): Locale {
  return readStoredLocale() ?? "en";
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

const localeListeners = new Set<() => void>();

function notifyLocaleListeners() {
  localeListeners.forEach((listener) => listener());
}

export function getLocaleServerSnapshot(): Locale {
  return "en";
}

export function getLocaleSnapshot(): Locale {
  return readLocalePreference();
}

export function subscribeLocale(onStoreChange: () => void) {
  localeListeners.add(onStoreChange);
  return () => {
    localeListeners.delete(onStoreChange);
  };
}

export function setLocalePreference(locale: Locale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  applyLocale(locale);
  notifyLocaleListeners();
}

export const localeInitScript = `(function(){try{var k=${JSON.stringify(LOCALE_STORAGE_KEY)};var s=localStorage.getItem(k);var l=s==="en"||s==="vi"?s:"en";document.documentElement.lang=l;}catch(e){}})();`;
