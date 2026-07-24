import type { Locale } from "@/shared/i18n/locale";

export function formatDisplayDate(
  value: string | null | undefined,
  locale: Locale | string = "en",
) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatCreatedLabel(
  value: string | null | undefined,
  locale: Locale | string = "en",
) {
  return formatDisplayDate(value, locale);
}
