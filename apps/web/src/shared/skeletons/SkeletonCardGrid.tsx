import { Skeleton } from "@/shared/ui/Skeleton";

type SkeletonCardGridProps = {
  cardClassName?: string;
  cardCount?: number;
  className?: string;
};

export function SkeletonCardGrid({
  cardClassName = "min-h-40 w-full rounded-xl",
  cardCount = 4,
  className = "mb-4 grid gap-4 px-4 lg:px-16 sm:grid-cols-2 xl:grid-cols-4",
}: SkeletonCardGridProps) {
  return (
    <div aria-hidden className={className}>
      {Array.from({ length: cardCount }, (_, index) => (
        <Skeleton className={cardClassName} key={index} />
      ))}
    </div>
  );
}
