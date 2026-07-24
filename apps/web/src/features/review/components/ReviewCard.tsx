import { ReviewProgress } from "@/features/review/components/ReviewProgress";
import type { ReviewStudyWord } from "@/features/review/model/reviewStudyWord";

type ReviewCardProps = {
  onToggleMeaning: () => void;
  reviewedCount: number;
  showMeaning: boolean;
  totalWords: number;
  word: ReviewStudyWord;
};

export function ReviewCard({
  onToggleMeaning,
  reviewedCount,
  showMeaning,
  totalWords,
  word,
}: ReviewCardProps) {
  return (
    <article
      aria-label={showMeaning ? "Hide meaning" : "Reveal meaning"}
      className="flex h-[480px] cursor-pointer flex-col rounded-lg bg-surface p-5 shadow-card sm:p-8 dark:border dark:border-border"
      onClick={onToggleMeaning}
    >
      <div className="mb-8 shrink-0">
        <ReviewProgress reviewedCount={reviewedCount} totalWords={totalWords} />
      </div>

      <div className="grid min-h-0 flex-1 content-center gap-6 overflow-y-auto text-center">
        <div>
          <div className="flex flex-wrap items-start justify-center gap-2">
            <h2 className="break-words text-[40px] font-black sm:text-[52px]">
              {word.word}
              {word.types.length > 0 ? (
                <span className="ml-2 font-medium text-muted-foreground text-[16px] sm:text-[18px]">
                  ({word.types.join(" · ")})
                </span>
              ) : null}
            </h2>
            {word.band ? (
              <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground text-[10px]">
                {word.band}
              </span>
            ) : null}
          </div>

          {word.ipa ? (
            <p className="text-muted-foreground text-[16px] sm:text-[18px]">
              /{word.ipa.replace(/^\/+|\/+$/g, "")}/
            </p>
          ) : null}
        </div>

        {showMeaning ? <ReviewMeaning word={word} /> : null}
      </div>

      <p className="mt-6 flex shrink-0 items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>{showMeaning ? "Click to hide" : "Click to review"}</span>
        <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 text-xs font-medium text-foreground">
          Space
        </kbd>
      </p>
    </article>
  );
}

function ReviewMeaning({ word }: { word: ReviewStudyWord }) {
  return (
    <div className="mx-auto grid w-full max-w-xl gap-5 text-center">
      {word.definitions.map((definition) => (
        <section className="grid gap-4" key={definition.id}>
          {word.definitions.length > 1 && definition.type ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {definition.type}
            </p>
          ) : null}
          <p className="text-2xl font-bold leading-tight">
            {definition.meaningVi || definition.definition || "No meaning added."}
          </p>
          {definition.definition && definition.meaningVi ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Definition
              </p>
              <p className="mt-2 leading-7">{definition.definition}</p>
            </div>
          ) : null}
          {definition.example ? (
            <div className="mx-auto w-full text-center">
              <p className="leading-7 text-foreground">
                &ldquo;{definition.example}&rdquo;
              </p>
              {definition.exampleVi ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {definition.exampleVi}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
