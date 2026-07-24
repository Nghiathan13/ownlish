"use client";

import { classNames } from "@/shared/lib/classNames";
import { useLocale } from "@/shared/providers/LocaleProvider";
import { sidebarLinkGroupClassName, Tooltip } from "@/shared/ui/Tooltip";

type SidebarLocaleToggleProps = {
  collapsed: boolean;
};

export function SidebarLocaleToggle({ collapsed }: SidebarLocaleToggleProps) {
  const { locale, setLocale, t } = useLocale();
  const targetLocale = locale === "en" ? "vi" : "en";
  const label = targetLocale === "en" ? t("locale.english") : t("locale.vietnamese");
  const tooltip =
    targetLocale === "en" ? t("locale.switchToEn") : t("locale.switchToVi");
  const badge = targetLocale.toUpperCase();

  return (
    <button
      type="button"
      aria-label={tooltip}
      onClick={() => setLocale(targetLocale)}
      className={classNames(
        "flex w-full cursor-pointer items-center rounded-lg px-2 py-2 text-foreground hover:bg-hover-overlay",
        collapsed ? "relative justify-center" : "gap-2",
        collapsed && sidebarLinkGroupClassName,
      )}
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
