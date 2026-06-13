import type { VocabWord } from "@/entities/vocab/api/vocab";
import { getDisplayVocabDefinitions } from "@/entities/vocab/lib/vocabWordDefinitions";
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
            <div className="mb-3">
              <h2 className="text-base font-semibold">{word.word}</h2>
            </div>

            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Meaning
                </dt>
                <dd className="mt-1">
                  <VocabDefinitionSummary word={word} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Next review
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  <VocabDefinitionReviewDates word={word} />
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

      <table className="hidden min-w-[640px] w-full border-collapse text-left text-sm md:table">
        <thead className="border-b border-border bg-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Word</th>
            <th className="px-4 py-3 font-semibold">Meaning</th>
            <th className="px-4 py-3 font-semibold">Next review</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => (
            <tr key={word.id} className="border-b border-border">
              <td className="px-4 py-3 font-semibold">{word.word}</td>
              <td className="px-4 py-3">
                <VocabDefinitionSummary word={word} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <VocabDefinitionReviewDates word={word} />
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

function VocabDefinitionSummary({ word }: { word: VocabWord }) {
  const definitions = getDisplayVocabDefinitions(word);

  if (definitions.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="grid gap-2">
      {definitions.map((definition, index) => (
        <div className="grid gap-1" key={`${definition.type ?? "type"}-${index}`}>
          <div className="flex flex-wrap items-center gap-2">
            {definition.type ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold">
                {definition.type}
              </span>
            ) : null}
            {definition.band ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {definition.band}
              </span>
            ) : null}
          </div>
          <p>{definition.meaningVi || definition.definition || "-"}</p>
        </div>
      ))}
    </div>
  );
}


function VocabDefinitionReviewDates({ word }: { word: VocabWord }) {
  const definitions = getDisplayVocabDefinitions(word);

  if (definitions.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="grid gap-2">
      {definitions.map((definition, index) => (
        <p key={`${definition.id}-${index}`}>
          {formatDisplayDate(definition.nextReview)}
        </p>
      ))}
    </div>
  );
}
