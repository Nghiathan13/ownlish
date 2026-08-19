"use client";

import { OxfordReviewBandShell } from "@/features/review";

type OxfordReviewPageProps = {
  band: string;
  group: string;
};

export function OxfordReviewPage({ band, group }: OxfordReviewPageProps) {
  return <OxfordReviewBandShell bandParam={band} groupParam={group} />;
}
