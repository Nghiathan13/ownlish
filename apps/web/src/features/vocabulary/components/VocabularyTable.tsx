import type { VocabWord } from "@/entities/vocab/api/vocab";
import { formatDisplayDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";

type VocabularyTableProps = {
  deletingWordId: string | null;
  onDelete: (word: VocabWord) => void;
  onEdit: (word: VocabWord) => void;
  words: VocabWord[];
};

export function VocabularyTable({
  deletingWordId,
  onDelete,
  onEdit,
  words,
}: VocabularyTableProps) {
  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {words.map((word) => (
          <article
            key={word.id}
            className="rounded-lg border border-border bg-background p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{word.word}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {word.type || "-"}
                </p>
              </div>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                Level {word.level}
              </span>
            </div>

            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Meaning
                </dt>
                <dd className="mt-1">{word.meaningVi || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Next review
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {formatDisplayDate(word.nextReview)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onEdit(word)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={deletingWordId === word.id}
                onClick={() => onDelete(word)}
              >
                {deletingWordId === word.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <table className="hidden min-w-[760px] w-full border-collapse text-left text-sm md:table">
        <thead className="border-b border-border bg-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Word</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Meaning</th>
            <th className="px-4 py-3 font-semibold">Level</th>
            <th className="px-4 py-3 font-semibold">Next review</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => (
            <tr key={word.id} className="border-b border-border">
              <td className="px-4 py-3 font-semibold">{word.word}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {word.type || "-"}
              </td>
              <td className="px-4 py-3">{word.meaningVi || "-"}</td>
              <td className="px-4 py-3">{word.level}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDisplayDate(word.nextReview)}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onEdit(word)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={deletingWordId === word.id}
                    onClick={() => onDelete(word)}
                  >
                    {deletingWordId === word.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
