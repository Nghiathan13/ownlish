"use client";

import type { ReactNode } from "react";
import { AuthQueryReset } from "@/features/auth";
import { ImmersiveToolbarProvider } from "@/shared/lib/providers";
import { LocaleProvider } from "@/shared/lib/providers";
import { QueryProvider } from "@/shared/lib/providers";
import { ThemeProvider } from "@/shared/lib/providers";
import { AppShell } from "./AppShell";
import { AuthProvider } from "./AuthProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <QueryProvider>
            <ImmersiveToolbarProvider>
              <AuthQueryReset />
              <AppShell>{children}</AppShell>
            </ImmersiveToolbarProvider>
          </QueryProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
