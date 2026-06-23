import { ToeicYearTabs } from "@/features/tests/overview/components/ToeicYearTabs";
import { DEFAULT_TOEIC_YEAR } from "@/features/tests/shared/constants/toeicYears";
import { PageShell } from "@/shared/ui/PageShell";
import { Skeleton } from "@/shared/ui/Skeleton";

export function TestsPageSkeleton() {
  return (
    <PageShell>
      <ToeicYearTabs selectedYear={DEFAULT_TOEIC_YEAR} />
      <div className="mb-4 grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-40 w-full rounded-xl" key={index} />
        ))}
      </div>
    </PageShell>
  );
}
