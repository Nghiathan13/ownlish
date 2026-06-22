import type { VocabReviewItem } from "@/entities/vocab/api/vocab";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import type { ReviewGrade } from "../lib/reviewSchedule";

type ReviewCardProps = {
  isSubmitting: boolean;
  onGrade: (grade: ReviewGrade) => void;
  onToggleMeaning: () => void;
  showMeaning: boolean;
  word: VocabReviewItem;
};

export function ReviewCard({
  isSubmitting,
  onGrade,
  onToggleMeaning,
  showMeaning,
  word,
}: ReviewCardProps) {
  const canGrade = showMeaning && !isSubmitting;
  const ipa = word.ipaUk ?? word.ipaUs;

  return (
    <div className="grid gap-5 rounded-xl border border-border p-4 sm:gap-6 sm:p-6">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Level {word.level} · Wrong {word.wrongCount}
        </p>
        <h2 className="break-words text-3xl font-bold leading-tight sm:text-4xl">
          {word.vocabWord.word}
        </h2>
        {ipa ? <p className="mt-2 text-muted-foreground">{ipa}</p> : null}
        {word.type ? (
          <p className="mt-2 text-sm text-muted-foreground">{word.type}</p>
        ) : null}
      </div>

      <div className="min-h-20 rounded-lg bg-muted p-4">
        {showMeaning ? (
          <ReviewMeaning word={word} />
        ) : (
          <p className="text-muted-foreground">Hide meaning while reviewing.</p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        <button
          type="button"
          className={secondaryTextButtonClassName("w-full")}
          onClick={onToggleMeaning}
        >
          {showMeaning ? "Hide meaning" : "Show meaning"}
        </button>
        <button
          type="button"
          className={secondaryTextButtonClassName("w-full")}
          disabled={!canGrade}
          onClick={() => onGrade("forgot")}
          title={showMeaning ? "Forgot" : "Show meaning before grading"}
        >
          Forgot
        </button>
        <button
          type="button"
          className={primaryTextButtonClassName("w-full")}
          disabled={!canGrade}
          onClick={() => onGrade("remember")}
          title={showMeaning ? "Remember" : "Show meaning before grading"}
        >
          Remember
        </button>
      </div>
    </div>
  );
}

function ReviewMeaning({ word }: { word: VocabReviewItem }) {
  return (
    <div className="grid gap-1">
      <p className="font-semibold">
        {word.meaningVi || word.definition || "No meaning added."}
      </p>
      {word.example ? (
        <p className="text-sm text-muted-foreground">{word.example}</p>
      ) : null}
    </div>
  );
}
