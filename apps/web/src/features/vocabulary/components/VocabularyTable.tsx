import { forwardRef, useEffect, useRef } from "react";
import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
import { expandWordsToDefinitionRows } from "@/features/vocabulary/lib/vocabularyTableRows";
import { formatDisplayDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";

type VocabularyTableProps = {
  allDefinitionsSelected: boolean;
  onEdit: (word: VocabWord, definition: VocabWordDefinition | null) => void;
  onToggleAllDefinitions: () => void;
  onToggleDefinition: (definitionId: string) => void;
  selectedDefinitionIds: ReadonlySet<string>;
  someDefinitionsSelected: boolean;
  words: VocabWord[];
};

export function VocabularyTable({
  allDefinitionsSelected,
  onEdit,
  onToggleAllDefinitions,
  onToggleDefinition,
  selectedDefinitionIds,
  someDefinitionsSelected,
  words,
}: VocabularyTableProps) {
  const rows = expandWordsToDefinitionRows(words);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        someDefinitionsSelected && !allDefinitionsSelected;
    }
  }, [allDefinitionsSelected, someDefinitionsSelected]);

  return (
    <>
      <div className="grid gap-3 md:hidden">
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
                      {definition ? (
                        <DefinitionSelectCheckbox
                          checked={selectedDefinitionIds.has(definition.id)}
                          label={`Select ${word.word}`}
                          onChange={() => onToggleDefinition(definition.id)}
                        />
                      ) : null}
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
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onEdit(row.word, definition)}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <table className="hidden min-w-[720px] w-full border-collapse text-left text-sm md:table">
        <thead className="border-b border-border bg-muted">
          <tr>
            <th className="w-12 px-3 py-3">
              <DefinitionSelectCheckbox
                ref={selectAllRef}
                checked={allDefinitionsSelected}
                label="Select all definitions on this page"
                onChange={onToggleAllDefinitions}
              />
            </th>
            <th className="px-4 py-3 font-semibold">Word</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Meaning</th>
            <th className="px-4 py-3 font-semibold">Next review</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
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
                <td className="px-3 py-3 align-middle">
                  {definition ? (
                    <DefinitionSelectCheckbox
                      checked={selectedDefinitionIds.has(definition.id)}
                      label={`Select ${row.word.word}`}
                      onChange={() => onToggleDefinition(definition.id)}
                    />
                  ) : null}
                </td>
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

const DefinitionSelectCheckbox = forwardRef<
  HTMLInputElement,
  {
    checked: boolean;
    label: string;
    onChange: () => void;
  }
>(function DefinitionSelectCheckbox({ checked, label, onChange }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      aria-label={label}
      className="size-4 accent-foreground"
      onChange={onChange}
    />
  );
});

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
