import type { DifficultReviewWord } from "@/entities/review/api/difficultReviewWords";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";
import { useT } from "@/shared/providers/LocaleProvider";

type DifficultReviewWordsCardProps = {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  words: DifficultReviewWord[];
};

const difficultTableGridClassName =
  "grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_3.25rem] items-center gap-3";

export function DifficultReviewWordsCard({
  error,
  isLoading,
  onRetry,
  words,
}: DifficultReviewWordsCardProps) {
  const t = useT();

  return (
    <article className="flex h-full min-h-[328px] min-w-[250px] w-full flex-col rounded-2xl border border-border bg-surface p-4 dark:bg-background lg:min-h-0">
      <p className="shrink-0 pb-3 text-left text-base leading-6 text-foreground">
        {t("dashboard.difficultWords")}
      </p>
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
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <DifficultTableHeader />
          <div className="mt-2 grid gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="h-8 animate-pulse rounded-md bg-muted" key={index} />
            ))}
          </div>
        </div>
      ) : words.length === 0 ? (
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <DifficultTableHeader />
          <p className="mt-4 text-sm text-muted-foreground">
            {t("dashboard.noDifficultWords")}
          </p>
        </div>
      ) : (
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <DifficultTableHeader />
          <OverlayScrollArea
            className="h-full"
            rootClassName="min-h-0 flex-1"
          >
            <div className="grid">
              {words.map((item, index) => (
                <div
                  className={`${difficultTableGridClassName} border-b border-border px-2 py-2 text-sm last:border-b-0`}
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
        </div>
      )}
    </article>
  );
}

function DifficultTableHeader() {
  const t = useT();

  return (
    <div
      className={`${difficultTableGridClassName} shrink-0 rounded-md bg-[#f0f0f0] px-2 py-2 text-sm font-medium text-muted-foreground dark:bg-surface`}
    >
      <span className="truncate">{t("dashboard.difficultTableWord")}</span>
      <span className="truncate">{t("dashboard.difficultTableCollection")}</span>
      <span className="truncate">{t("dashboard.difficultTableWrong")}</span>
    </div>
  );
}
