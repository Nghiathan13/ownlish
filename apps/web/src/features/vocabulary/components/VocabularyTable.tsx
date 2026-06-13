import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
import { expandWordsToDefinitionRows } from "@/features/vocabulary/lib/vocabularyTableRows";
import { formatDisplayDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";

type VocabularyTableProps = {
  deletingDefinitionId: string | null;
  onDelete: (word: VocabWord, definition: VocabWordDefinition) => void;
  onEdit: (word: VocabWord, definition: VocabWordDefinition | null) => void;
  words: VocabWord[];
};

export function VocabularyTable({
  deletingDefinitionId,
  onDelete,
  onEdit,
  words,
}: VocabularyTableProps) {
  const rows = expandWordsToDefinitionRows(words);

  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {words.map((word) => {
          const wordRows = expandWordsToDefinitionRows([word]);

          return (
            <article
              key={word.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="mb-3">
                <h2 className="text-base font-semibold">{word.word}</h2>
              </div>

              <div className="grid gap-3 text-sm">
                {wordRows.map((row) => {
                  const definition = row.definition;

                  return (
                    <div key={getDefinitionRowKey(row)} className="grid gap-3">
                      <dl className="grid grid-cols-3 gap-3">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Type
                          </dt>
                          <dd className="mt-1">
                            <DefinitionTypeCell definition={row.definition} />
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Meaning
                          </dt>
                          <dd className="mt-1">
                            <DefinitionMeaningCell definition={row.definition} />
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Next review
                          </dt>
                          <dd className="mt-1 text-muted-foreground">
                            <DefinitionNextReviewCell definition={row.definition} />
                          </dd>
                        </div>
                      </dl>
                      {definition ? (
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onEdit(row.word, definition)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={deletingDefinitionId === definition.id}
                            onClick={() => onDelete(row.word, definition)}
                          >
                            {deletingDefinitionId === definition.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <table className="hidden min-w-[760px] w-full border-collapse text-left text-sm md:table">
        <thead className="border-b border-border bg-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Word</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Meaning</th>
            <th className="px-4 py-3 font-semibold">Next review</th>
            <th className="px-4 py-3 font-semibold">Edit</th>
            <th className="px-4 py-3 font-semibold">Delete</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const definition = row.definition;

            return (
              <tr
                key={getDefinitionRowKey(row)}
                className={row.isLastInWord ? "border-b border-border" : undefined}
              >
                {row.isFirstInWord ? (
                  <td
                    className="px-4 py-3 align-middle font-semibold"
                    rowSpan={row.definitionCount}
                  >
                    {row.word.word}
                  </td>
                ) : null}
                <td className="px-4 py-3 align-middle">
                  <DefinitionTypeCell definition={row.definition} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <DefinitionMeaningCell definition={row.definition} />
                </td>
                <td className="px-4 py-3 align-middle text-muted-foreground">
                  <DefinitionNextReviewCell definition={row.definition} />
                </td>
                <td className="px-4 py-3 align-middle">
                  {definition ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onEdit(row.word, definition)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3 align-middle">
                  {definition ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={deletingDefinitionId === definition.id}
                      onClick={() => onDelete(row.word, definition)}
                    >
                      {deletingDefinitionId === definition.id
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function getDefinitionRowKey(row: {
  word: VocabWord;
  definition: VocabWordDefinition | null;
  definitionIndex: number;
}) {
  return `${row.word.id}-${row.definition?.id ?? "empty"}-${row.definitionIndex}`;
}

function DefinitionTypeCell({
  definition,
}: {
  definition: VocabWordDefinition | null;
}) {
  if (!definition?.type) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-semibold">
      {definition.type}
    </span>
  );
}

function DefinitionMeaningCell({
  definition,
}: {
  definition: VocabWordDefinition | null;
}) {
  if (!definition) {
    return <span className="text-muted-foreground">-</span>;
  }

  const meaning = definition.meaningVi || definition.definition || "-";

  return (
    <div className="flex items-start justify-between gap-3">
      <p className="min-w-0 flex-1 break-words">{meaning}</p>
      {definition.band ? (
        <span className="inline-flex shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {definition.band}
        </span>
      ) : null}
    </div>
  );
}

function DefinitionNextReviewCell({
  definition,
}: {
  definition: VocabWordDefinition | null;
}) {
  if (!definition) {
    return <span>-</span>;
  }

  return <span>{formatDisplayDate(definition.nextReview)}</span>;
}
