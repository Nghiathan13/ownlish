import type { ReactNode } from "react";
import { OxfordReviewBandShell } from "@/features/review/oxford/components/OxfordReviewBandShell";

type OxfordReviewLayoutProps = {
  children: ReactNode;
};

/** Persistent shell so band/part navigations do not remount the review card. */
export default function OxfordReviewLayout({ children }: OxfordReviewLayoutProps) {
  return (
    <>
      <OxfordReviewBandShell />
      {children}
    </>
  );
}
