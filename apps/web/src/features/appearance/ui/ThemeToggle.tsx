"use client";

import { classNames } from "@/shared/lib/classNames";
import { useResolvedTheme, useT, useTheme } from "@/shared/lib/providers";
import { DarkModeIcon } from "@/shared/ui/icons";
import { LightModeIcon } from "@/shared/ui/icons";
import { sidebarLinkGroupClassName, Tooltip } from "@/shared/ui/Tooltip";

type ThemeToggleProps =
  | { variant: "sidebar"; collapsed: boolean }
  | { variant: "compact" };

export function ThemeToggle(props: ThemeToggleProps) {
  const t = useT();
  const { setTheme } = useTheme();
  const resolvedTheme = useResolvedTheme();
  const targetTheme = resolvedTheme === "dark" ? "light" : "dark";
  const label =
    targetTheme === "light" ? t("theme.lightMode") : t("theme.darkMode");
  const tooltip =
    targetTheme === "light" ? t("theme.switchToLight") : t("theme.switchToDark");
  const Icon = targetTheme === "light" ? LightModeIcon : DarkModeIcon;

  if (props.variant === "compact") {
    return (
      <button
        aria-label={tooltip}
        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-hover-overlay"
        onClick={() => setTheme(targetTheme)}
        type="button"
      >
        <Icon className="size-6 shrink-0" />
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
      onClick={() => setTheme(targetTheme)}
      type="button"
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
