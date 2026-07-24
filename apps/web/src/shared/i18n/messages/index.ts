import type { Locale } from "@/shared/i18n/locale";
import { en, type MessageKey, type MessageTree } from "@/shared/i18n/messages/en";
import { vi } from "@/shared/i18n/messages/vi";

export const messagesByLocale: Record<Locale, MessageTree> = {
  en,
  vi,
};

export function translate(locale: Locale, key: MessageKey): string {
  const parts = key.split(".");
  let current: unknown = messagesByLocale[locale];

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
      continue;
    }

    return key;
  }

  return typeof current === "string" ? current : key;
}

export function formatMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export type { MessageKey, MessageTree };
