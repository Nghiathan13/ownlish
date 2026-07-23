import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthQueryReset } from "@/features/auth/components/AuthQueryReset";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { AppShell } from "@/features/shell";
import { ImmersiveToolbarProvider } from "@/features/shell/providers/ImmersiveToolbarProvider";
import { QueryProvider } from "@/shared/providers/QueryProvider";
import { ThemeProvider } from "@/shared/providers/ThemeProvider";
import { themeInitScript } from "@/shared/ui/theme/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EngVocab",
  description: "English vocabulary learning app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className="flex h-dvh min-h-0 flex-col overflow-hidden"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <ImmersiveToolbarProvider>
                <AuthQueryReset />
                <AppShell>{children}</AppShell>
              </ImmersiveToolbarProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
