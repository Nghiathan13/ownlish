"use client";

import { Button } from "@/shared/ui/Button";
import type { ToeicTestSummary } from "@/features/tests/api/types";

type TestCardProps = {
  test: ToeicTestSummary;
  onPractice: () => void;
};

export function TestCard({ test, onPractice }: TestCardProps) {
  return (
    <article className="rounded-xl border border-border p-5 transition hover:bg-muted">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{test.label}</h2>
          <p className="text-sm text-muted-foreground">TOEIC {test.year}</p>
        </div>
      </div>
      <Button onClick={onPractice} type="button">
        Practice
      </Button>
    </article>
  );
}
