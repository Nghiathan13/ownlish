"use client";

import { classNames } from "@/shared/lib/classNames";
import { useLocale } from "@/shared/lib/providers";
import { sidebarLinkGroupClassName, Tooltip } from "@/shared/ui/Tooltip";

type LocaleToggleProps =
  | { variant: "sidebar"; collapsed: boolean }
  | { variant: "compact" };

export function LocaleToggle(props: LocaleToggleProps) {
  const { locale, setLocale, t } = useLocale();
  const targetLocale = locale === "en" ? "vi" : "en";
  const label = targetLocale === "en" ? t("locale.english") : t("locale.vietnamese");
  const tooltip =
    targetLocale === "en" ? t("locale.switchToEn") : t("locale.switchToVi");
  const badge = targetLocale.toUpperCase();

  if (props.variant === "compact") {
    return (
      <button
        aria-label={tooltip}
        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold tracking-wide text-foreground hover:bg-hover-overlay"
        onClick={() => setLocale(targetLocale)}
        type="button"
      >
        {badge}
      </button>
    );
  }

  const { collapsed } = props;

  return (
    <button
      aria-label={collapsed ? tooltip : `${label}: ${tooltip}`}
      className={classNames(
        "flex w-full cursor-pointer items-center rounded-lg px-2 py-2 text-foreground hover:bg-hover-overlay",
        collapsed ? "relative justify-center" : "gap-2",
        collapsed && sidebarLinkGroupClassName,
      )}
      onClick={() => setLocale(targetLocale)}
      type="button"
    >
      <span className="grid size-6 shrink-0 place-items-center text-xs font-semibold tracking-wide">
        {badge}
      </span>
      {!collapsed ? <span className="text-base font-normal">{label}</span> : null}
      {collapsed ? (
        <Tooltip group="sidebar-link" placement="right">
          {tooltip}
        </Tooltip>
      ) : null}
    </button>
  );
}
