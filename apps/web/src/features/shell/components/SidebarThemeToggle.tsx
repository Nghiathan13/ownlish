"use client";

import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { useResolvedTheme, useTheme } from "@/shared/providers/ThemeProvider";
import { DarkModeIcon } from "@/shared/ui/icons/DarkModeIcon";
import { LightModeIcon } from "@/shared/ui/icons/LightModeIcon";
import { sidebarLinkGroupClassName, Tooltip } from "@/shared/ui/Tooltip";

type SidebarThemeToggleProps = {
  collapsed: boolean;
};

export function SidebarThemeToggle({ collapsed }: SidebarThemeToggleProps) {
  const t = useT();
  const { setTheme } = useTheme();
  const resolvedTheme = useResolvedTheme();
  const targetTheme = resolvedTheme === "dark" ? "light" : "dark";
  const label =
    targetTheme === "light" ? t("theme.lightMode") : t("theme.darkMode");
  const tooltip =
    targetTheme === "light" ? t("theme.switchToLight") : t("theme.switchToDark");
  const Icon = targetTheme === "light" ? LightModeIcon : DarkModeIcon;

  return (
    <button
      type="button"
      aria-label={collapsed ? tooltip : `${label}: ${tooltip}`}
      onClick={() => setTheme(targetTheme)}
      className={classNames(
        "flex w-full cursor-pointer items-center rounded-lg px-2 py-2 text-foreground hover:bg-hover-overlay",
        collapsed ? "relative justify-center" : "gap-2",
        collapsed && sidebarLinkGroupClassName,
      )}
    >
      <Icon className="size-6 shrink-0" />
      {!collapsed ? <span className="text-base font-normal">{label}</span> : null}
      {collapsed ? (
        <Tooltip group="sidebar-link" placement="right">
          {tooltip}
        </Tooltip>
      ) : null}
    </button>
  );
}
