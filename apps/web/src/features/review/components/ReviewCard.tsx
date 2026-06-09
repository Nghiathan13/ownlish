import type { VocabWord } from "@/entities/vocab/api/vocab";
import { Button } from "@/shared/ui/Button";
import type { ReviewGrade } from "../lib/reviewSchedule";

type ReviewCardProps = {
  isSubmitting: boolean;
  onGrade: (grade: ReviewGrade) => void;
  onToggleMeaning: () => void;
  showMeaning: boolean;
  word: VocabWord;
};

export function ReviewCard({
  isSubmitting,
  onGrade,
  onToggleMeaning,
  showMeaning,
  word,
}: ReviewCardProps) {
  return (
    <div className="grid gap-6 rounded-xl border border-border p-6">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Level {word.level} · Wrong {word.wrongCount}
        </p>
        <h2 className="text-4xl font-bold leading-tight">{word.word}</h2>
        {word.ipa ? (
          <p className="mt-2 text-muted-foreground">{word.ipa}</p>
        ) : null}
        {word.type ? (
          <p className="mt-2 text-sm text-muted-foreground">{word.type}</p>
        ) : null}
      </div>

      <div className="min-h-20 rounded-lg bg-muted p-4">
        {showMeaning ? (
          <div className="grid gap-2">
            <p className="font-semibold">
              {word.meaningVi || word.definition || "No meaning added."}
            </p>
            {word.example ? (
              <p className="text-sm text-muted-foreground">{word.example}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground">Hide meaning while reviewing.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onToggleMeaning}>
          {showMeaning ? "Hide meaning" : "Show meaning"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => onGrade("forgot")}
        >
          Forgot
        </Button>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => onGrade("remember")}
        >
          Remember
        </Button>
      </div>
    </div>
  );
}
