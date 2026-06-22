import { classNames } from "@/shared/lib/classNames";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={classNames("animate-pulse rounded-md bg-muted", className)}
    />
  );
}
