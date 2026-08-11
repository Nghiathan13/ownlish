"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getResolvedThemeServerSnapshot,
  getResolvedThemeSnapshot,
  getThemeServerSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribeTheme,
  type ResolvedTheme,
  type Theme,
} from "@/shared/ui/theme/theme";

type ThemeContextValue = {
  setTheme: (theme: Theme) => void;
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  return (
    <ThemeContext.Provider value={{ setTheme: setThemePreference, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribeTheme,
    getResolvedThemeSnapshot,
    getResolvedThemeServerSnapshot,
  );
}
