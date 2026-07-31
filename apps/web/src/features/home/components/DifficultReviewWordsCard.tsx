import type { DifficultReviewWord } from "@/entities/review/api/difficultReviewWords";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";
import { useT } from "@/shared/providers/LocaleProvider";

type DifficultReviewWordsCardProps = {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  words: DifficultReviewWord[];
};

export function DifficultReviewWordsCard({
  error,
  isLoading,
  onRetry,
  words,
}: DifficultReviewWordsCardProps) {
  const t = useT();

  return (
    <article className="flex h-full min-h-[328px] w-full flex-col rounded-2xl border border-border bg-surface p-5 dark:bg-background lg:min-h-0">
      <div className="relative pb-3">
        <p className="text-center text-base leading-6 text-foreground">
          {t("dashboard.difficultWords")}
        </p>
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 -left-5 -right-5 h-px bg-border"
        />
      </div>
      {error ? (
        <div className="mt-4 text-sm text-muted-foreground">
          <p>{error}</p>
          <button
            className="mt-3 text-foreground underline underline-offset-4"
            onClick={onRetry}
            type="button"
          >
            {t("dashboard.tryAgain")}
          </button>
        </div>
      ) : isLoading ? (
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="h-8 animate-pulse rounded-md bg-muted" key={index} />
          ))}
        </div>
      ) : words.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("dashboard.noDifficultWords")}
        </p>
      ) : (
        <OverlayScrollArea
          className="h-full pr-5"
          rootClassName="-mr-5 mt-2 min-h-0 flex-1"
        >
          <div className="grid">
            {words.map((item, index) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto] items-center gap-3 border-b border-border py-2 text-sm last:border-b-0"
                key={`${item.collectionName}-${item.word}-${item.wrongCount}-${index}`}
              >
                <span className="truncate font-medium">{item.word}</span>
                <span className="truncate text-muted-foreground">
                  {item.collectionName}
                </span>
                <span className="font-mono font-semibold tabular-nums text-danger">
                  {item.wrongCount}
                </span>
              </div>
            ))}
          </div>
        </OverlayScrollArea>
      )}
    </article>
  );
}
