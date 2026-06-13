import type { VocabReviewItem } from "@/entities/vocab/api/vocab";
import { Button } from "@/shared/ui/Button";
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
        <Button
          type="button"
          variant="secondary"
          onClick={onToggleMeaning}
          className="w-full"
        >
          {showMeaning ? "Hide meaning" : "Show meaning"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canGrade}
          onClick={() => onGrade("forgot")}
          title={showMeaning ? "Forgot" : "Show meaning before grading"}
          className="w-full"
        >
          Forgot
        </Button>
        <Button
          type="button"
          disabled={!canGrade}
          onClick={() => onGrade("remember")}
          title={showMeaning ? "Remember" : "Show meaning before grading"}
          className="w-full"
        >
          Remember
        </Button>
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
