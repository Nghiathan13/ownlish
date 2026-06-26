import { Skeleton } from "@/shared/ui/Skeleton";

type SkeletonTabPillsProps = {
  className?: string;
  count?: number;
  pillClassName?: string;
};

export function SkeletonTabPills({
  className = "mb-4 flex flex-wrap gap-2 px-4",
  count = 4,
  pillClassName = "h-9 w-28",
}: SkeletonTabPillsProps) {
  return (
    <div aria-hidden className={className}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton className={pillClassName} key={index} />
      ))}
    </div>
  );
}
