type ReviewProgressProps = {
  reviewedCount: number;
  totalWords: number;
};

export function ReviewProgress({
  reviewedCount,
  totalWords,
}: ReviewProgressProps) {
  const progressPercent = totalWords > 0 ? (reviewedCount / totalWords) * 100 : 0;

  return (
    <div className="grid w-full gap-2">
      <p className="text-center text-sm text-muted-foreground">
        {reviewedCount}/{totalWords}
      </p>
      <div
        aria-label={`${reviewedCount} of ${totalWords} reviewed`}
        aria-valuemax={totalWords}
        aria-valuemin={0}
        aria-valuenow={reviewedCount}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
