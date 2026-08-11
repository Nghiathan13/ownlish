"use client";

import type { ReactNode } from "react";
import { AuthQueryReset } from "@/features/auth";
import { ImmersiveToolbarProvider } from "@/features/shell/providers/ImmersiveToolbarProvider";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { QueryProvider } from "@/shared/providers/QueryProvider";
import { ThemeProvider } from "@/shared/providers/ThemeProvider";
import { AppShell } from "@/widgets/app-shell";
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
