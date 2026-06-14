import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
import {
  expandWordsToDefinitionRows,
  type VocabularyDefinitionRow,
} from "@/features/vocabulary/lib/vocabularyTableRows";
import { classNames } from "@/shared/lib/classNames";
import { formatDisplayDate } from "@/shared/lib/date";
import { EditIcon } from "@/shared/ui/icons/EditIcon";
import { SelectCheckbox } from "@/shared/ui/SelectCheckbox";

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

              <div className="text-sm">
                {wordRows.map((row) => {
                  const definition = row.definition;

                  return (
                    <div
                      key={getDefinitionRowKey(row)}
                      className={classNames(
                        "grid gap-3",
                        !row.isFirstInWord &&
                          "mt-2 border-t border-border pt-2",
                      )}
                    >
                      {definition ? (
                        <SelectCheckbox
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
                        <EditDefinitionButton
                          label={`Edit ${word.word}`}
                          onClick={() => onEdit(row.word, definition)}
                        />
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
        <thead className="sticky top-0 z-10 bg-surface [transform:translateZ(0)]">
          <tr className="border-b border-border">
            <th className="w-12 bg-surface px-3 py-3 align-middle">
              <div className="flex h-5 items-center">
                <SelectCheckbox
                  checked={allDefinitionsSelected}
                  indeterminate={someDefinitionsSelected && !allDefinitionsSelected}
                  label="Select all definitions on this page"
                  onChange={onToggleAllDefinitions}
                />
              </div>
            </th>
            <th className="bg-surface px-4 py-3 align-middle font-semibold">Word</th>
            <th className="bg-surface px-4 py-3 align-middle font-semibold">Type</th>
            <th className="bg-surface px-4 py-3 align-middle font-semibold">Meaning</th>
            <th className="bg-surface px-4 py-3 align-middle font-semibold">Next review</th>
            <th className="bg-surface px-4 py-3 align-middle font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const definition = row.definition;
            const showRowBorder =
              row.isLastInWord && rowIndex < rows.length - 1;

            return (
              <tr
                key={getDefinitionRowKey(row)}
                className={showRowBorder ? "border-b border-border" : undefined}
              >
                <td
                  className={classNames(
                    "px-3 align-middle",
                    getDefinitionRowPadding(row),
                  )}
                >
                  {definition ? (
                    <div className="flex h-5 items-center">
                      <SelectCheckbox
                        checked={selectedDefinitionIds.has(definition.id)}
                        label={`Select ${row.word.word}`}
                        onChange={() => onToggleDefinition(definition.id)}
                      />
                    </div>
                  ) : null}
                </td>
                {row.isFirstInWord ? (
                  <td
                    className={classNames(
                      "px-4 align-middle font-semibold",
                      getDefinitionRowPadding(row),
                    )}
                    rowSpan={row.definitionCount}
                  >
                    {row.word.word}
                  </td>
                ) : null}
                <td
                  className={classNames(
                    "px-4 align-middle",
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionTypeCell definition={row.definition} />
                </td>
                <td
                  className={classNames(
                    "px-4 align-middle",
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionMeaningCell definition={row.definition} />
                </td>
                <td
                  className={classNames(
                    "px-4 align-middle text-muted-foreground",
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionNextReviewCell definition={row.definition} />
                </td>
                <td
                  className={classNames(
                    "px-4 align-middle",
                    getDefinitionRowPadding(row),
                  )}
                >
                  {definition ? (
                    <EditDefinitionButton
                      label={`Edit ${row.word.word}`}
                      onClick={() => onEdit(row.word, definition)}
                    />
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

function getDefinitionRowPadding(row: Pick<
  VocabularyDefinitionRow,
  "isFirstInWord" | "isLastInWord"
>) {
  if (row.isFirstInWord && row.isLastInWord) {
    return "py-1";
  }

  if (row.isFirstInWord) {
    return "pt-1 pb-0.5";
  }

  if (row.isLastInWord) {
    return "pt-0.5 pb-1";
  }

  return "py-0.5";
}

function EditDefinitionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors duration-200 hover:border-foreground"
      onClick={onClick}
    >
      <EditIcon className="size-3.5" />
    </button>
  );
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
