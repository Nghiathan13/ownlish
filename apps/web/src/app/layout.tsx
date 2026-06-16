import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthQueryReset } from "@/features/auth/components/AuthQueryReset";
import { Navbar } from "@/features/auth/components/Navbar";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { QueryProvider } from "@/shared/providers/QueryProvider";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh min-h-0 flex-col overflow-hidden">
        <AuthProvider>
          <QueryProvider>
            <AuthQueryReset />
            <Navbar />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
