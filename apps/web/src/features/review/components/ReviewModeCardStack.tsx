import type { ReactNode } from "react";
import {
  ReviewModeToggle,
  type ReviewMode,
} from "@/features/review/components/ReviewModeToggle";

type ReviewModeCardStackProps = {
  children: ReactNode;
  mode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
};

/** Mode toggle stacked above the review card. */
export function ReviewModeCardStack({
  children,
  mode,
  onModeChange,
}: ReviewModeCardStackProps) {
  return (
    <div className="grid gap-4">
      <ReviewModeToggle
        mode={mode}
        onModeChange={onModeChange}
        orientation="horizontal"
      />
      {children}
    </div>
  );
}
