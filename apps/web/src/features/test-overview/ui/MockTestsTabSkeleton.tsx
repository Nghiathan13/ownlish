import { testOverviewCardSkeletonClassName } from "../lib/testOverviewCard";
import { Skeleton } from "@/shared/ui/Skeleton";

export function MockTestsTabSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton
          className={testOverviewCardSkeletonClassName}
          key={index}
        />
      ))}
    </>
  );
}
