"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { SidebarUserMenu } from "@/features/shell/components/SidebarUserMenu";
import {
  APP_NAV_LINKS,
  getAppSidebarLinkClass,
  isAppNavLinkActive,
} from "@/features/shell/lib/appNavLinks";
import { classNames } from "@/shared/lib/classNames";
import { useLocale, useT } from "@/shared/providers/LocaleProvider";
import { useResolvedTheme, useTheme } from "@/shared/providers/ThemeProvider";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { DarkModeIcon } from "@/shared/ui/icons/DarkModeIcon";
import { LightModeIcon } from "@/shared/ui/icons/LightModeIcon";
import { LogoIcon } from "@/shared/ui/icons/LogoIcon";
import { MenuIcon } from "@/shared/ui/icons/MenuIcon";

function MobileNavLocaleToggle() {
  const { locale, setLocale, t } = useLocale();
  const targetLocale = locale === "en" ? "vi" : "en";
  const tooltip =
    targetLocale === "en" ? t("locale.switchToEn") : t("locale.switchToVi");

  return (
    <button
      aria-label={tooltip}
      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold tracking-wide text-foreground hover:bg-hover-overlay"
      onClick={() => setLocale(targetLocale)}
      type="button"
    >
      {targetLocale.toUpperCase()}
    </button>
  );
}

function MobileNavThemeToggle() {
  const t = useT();
  const { setTheme } = useTheme();
  const resolvedTheme = useResolvedTheme();
  const targetTheme = resolvedTheme === "dark" ? "light" : "dark";
  const tooltip =
    targetTheme === "light" ? t("theme.switchToLight") : t("theme.switchToDark");
  const Icon = targetTheme === "light" ? LightModeIcon : DarkModeIcon;

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

export function MobileTopNav() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { logout, updateProfile, user } = useAuthSession();
  const navRef = useRef<HTMLElement>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const scroller = navRef.current?.parentElement;
    if (!scroller) {
      return;
    }

    const updatePosition = () => {
      setIsAtTop(scroller.scrollTop <= 0);
    };

    updatePosition();
    scroller.addEventListener("scroll", updatePosition, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", updatePosition);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const scroller = document.querySelector<HTMLElement>(
      "[data-mobile-shell-scroll]",
    );
    const previousOverflow = scroller?.style.overflow;

    if (scroller) {
      scroller.style.overflow = "hidden";
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (scroller) {
        scroller.style.overflow = previousOverflow ?? "";
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        ref={navRef}
        className={classNames(
          "pointer-events-none sticky z-50 mx-4 shrink-0 transition-[top,margin-top] duration-200 sm:hidden",
          isAtTop ? "top-4 mt-4" : "top-2 mt-0",
        )}
      >
        <div className="pointer-events-auto flex items-center justify-between rounded-[16px] border border-border bg-surface p-2">
          <Link
            aria-label="EngVocab"
            className="flex items-center px-2 hover:opacity-80"
            href="/"
          >
            <LogoIcon className="size-6 shrink-0" />
          </Link>
          <div className="flex items-center gap-2">
            <MobileNavLocaleToggle />
            <MobileNavThemeToggle />
            <button
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t("shell.closeMenu") : t("shell.openMenu")}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-hover-overlay"
              onClick={() => setMenuOpen((current) => !current)}
              type="button"
            >
              {menuOpen ? (
                <CloseIcon className="size-6 shrink-0" />
              ) : (
                <MenuIcon className="size-6 shrink-0" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen ? (
        <div
          aria-label={t("shell.openMenu")}
          aria-modal="true"
          className="fixed inset-0 z-40 flex flex-col bg-surface sm:hidden"
          role="dialog"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pt-24">
            {APP_NAV_LINKS.map((link) => {
              const isActive = isAppNavLinkActive(pathname, link);
              const Icon = isActive ? link.activeIcon : link.icon;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={classNames(
                    getAppSidebarLinkClass(pathname, link),
                    "flex items-center gap-2 rounded-lg px-2 py-2",
                  )}
                  href={link.href}
                  key={link.href}
                  onClick={() => setMenuOpen(false)}
                  scroll={false}
                >
                  <Icon className="size-6 shrink-0" />
                  <span>{t(link.labelKey)}</span>
                </Link>
              );
            })}

          </div>

          {user ? (
            <div className="shrink-0 px-4 pt-2 pb-8">
              <SidebarUserMenu
                collapsed={false}
                onLogout={() => {
                  void logout();
                  router.replace("/login");
                }}
                onUpdateProfile={updateProfile}
                user={user}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
