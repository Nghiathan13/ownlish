import type { ReactNode } from "react";

type OxfordReviewLayoutProps = {
  children: ReactNode;
};

/** The persistent review workspace lives in the parent review layout. */
export default function OxfordReviewLayout({ children }: OxfordReviewLayoutProps) {
  return children;
}
