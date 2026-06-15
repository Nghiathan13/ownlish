import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
import {
  expandWordsToDefinitionRows,
  type VocabularyDefinitionRow,
} from "@/features/vocabulary/lib/vocabularyTableRows";
import {
  formatIpaDisplay,
  getIpaFieldValue,
  getSharedIpaUk,
  getSharedIpaUs,
  hasUniformIpaUk,
  hasUniformIpaUs,
} from "@/features/vocabulary/lib/vocabularyIpa";
import {
  isColumnVisible,
  VOCABULARY_TABLE_COLUMN_WIDTH,
  type VocabularyColumnVisibility,
  type VocabularyToggleableColumnId,
} from "@/features/vocabulary/lib/vocabularyTableColumns";
import { classNames } from "@/shared/lib/classNames";
import { formatDisplayDate } from "@/shared/lib/date";
import { EditIcon } from "@/shared/ui/icons/EditIcon";
import { SelectCheckbox } from "@/shared/ui/SelectCheckbox";

type VocabularyTableProps = {
  allDefinitionsSelected: boolean;
  columnVisibility: VocabularyColumnVisibility;
  onEdit: (word: VocabWord, definition: VocabWordDefinition | null) => void;
  onToggleAllDefinitions: () => void;
  onToggleDefinition: (definitionId: string) => void;
  selectedDefinitionIds: ReadonlySet<string>;
  someDefinitionsSelected: boolean;
  words: VocabWord[];
};

export function VocabularyTable({
  allDefinitionsSelected,
  columnVisibility,
  onEdit,
  onToggleAllDefinitions,
  onToggleDefinition,
  selectedDefinitionIds,
  someDefinitionsSelected,
  words,
}: VocabularyTableProps) {
  const rows = expandWordsToDefinitionRows(words);
  const showColumn = (columnId: VocabularyToggleableColumnId) =>
    isColumnVisible(columnVisibility, columnId);

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {words.map((word) => {
          const wordRows = expandWordsToDefinitionRows([word]);
          const uniformIpaUk = hasUniformIpaUk(word.definitions);
          const uniformIpaUs = hasUniformIpaUs(word.definitions);
          const showHeaderIpa =
            (uniformIpaUk && showColumn("ipaUk")) ||
            (uniformIpaUs && showColumn("ipaUs"));

          return (
            <article
              key={word.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold">{word.word}</h2>
                {showHeaderIpa ? (
                  <div className="grid shrink-0 gap-0.5 text-right text-base text-muted-foreground">
                    {uniformIpaUk && showColumn("ipaUk") ? (
                      <DefinitionIpaValueCell
                        value={getSharedIpaUk(word.definitions)}
                      />
                    ) : null}
                    {uniformIpaUs && showColumn("ipaUs") ? (
                      <DefinitionIpaValueCell
                        value={getSharedIpaUs(word.definitions)}
                      />
                    ) : null}
                  </div>
                ) : null}
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
                      {!uniformIpaUk && showColumn("ipaUk") ? (
                        <dl className="grid grid-cols-1 gap-3">
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              IPA UK
                            </dt>
                            <dd className="mt-1">
                              <DefinitionIpaValueCell
                                value={getIpaFieldValue(row.definition, "uk")}
                              />
                            </dd>
                          </div>
                        </dl>
                      ) : null}
                      {!uniformIpaUs && showColumn("ipaUs") ? (
                        <dl className="grid grid-cols-1 gap-3">
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              IPA US
                            </dt>
                            <dd className="mt-1">
                              <DefinitionIpaValueCell
                                value={getIpaFieldValue(row.definition, "us")}
                              />
                            </dd>
                          </div>
                        </dl>
                      ) : null}
                      <dl className="grid grid-cols-2 gap-3">
                        {showColumn("type") ? (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Type
                          </dt>
                          <dd className="mt-1">
                            <DefinitionTypeCell definition={row.definition} />
                          </dd>
                        </div>
                        ) : null}
                        {showColumn("meaning") ? (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Meaning
                          </dt>
                          <dd className="mt-1">
                            <DefinitionMeaningCell definition={row.definition} />
                          </dd>
                        </div>
                        ) : null}
                        {showColumn("level") ? (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Level
                          </dt>
                          <dd className="mt-1">
                            <DefinitionLevelCell definition={row.definition} />
                          </dd>
                        </div>
                        ) : null}
                        {showColumn("example") ? (
                        <div className="col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Example
                          </dt>
                          <dd className="mt-1">
                            <DefinitionExampleCell definition={row.definition} />
                          </dd>
                        </div>
                        ) : null}
                        {showColumn("nextReview") ? (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Next review
                          </dt>
                          <dd className="mt-1 text-muted-foreground">
                            <DefinitionNextReviewCell definition={row.definition} />
                          </dd>
                        </div>
                        ) : null}
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

      <table className="hidden w-full min-w-[920px] table-fixed border-collapse text-left text-sm md:table">
        <thead className="sticky top-0 z-10 bg-surface shadow-[0_0.5px_0_0_var(--border)] [transform:translateZ(0)]">
          <tr>
            <th className="bg-surface w-10 px-3 py-3 align-middle">
              <div className="flex items-center">
                <SelectCheckbox
                  checked={allDefinitionsSelected}
                  indeterminate={someDefinitionsSelected && !allDefinitionsSelected}
                  label="Select all definitions on this page"
                  onChange={onToggleAllDefinitions}
                />
              </div>
            </th>
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.word,
              )}
            >
              Word
            </th>
            {showColumn("ipaUk") ? (
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.ipaUk,
              )}
            >
              IPA UK
            </th>
            ) : null}
            {showColumn("ipaUs") ? (
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.ipaUs,
              )}
            >
              IPA US
            </th>
            ) : null}
            {showColumn("type") ? (
            <th className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.type,
              )}
            >
              Type
            </th>
            ) : null}
            {showColumn("meaning") ? (
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.meaning,
              )}
            >
              Meaning
            </th>
            ) : null}
            {showColumn("level") ? (
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.level,
              )}
            >
              Level
            </th>
            ) : null}
            {showColumn("example") ? (
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.example,
              )}
            >
              Example
            </th>
            ) : null}
            {showColumn("nextReview") ? (
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.nextReview,
              )}
            >
              Next review
            </th>
            ) : null}
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.actions,
              )}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const definition = row.definition;
            const uniformIpaUk = hasUniformIpaUk(row.word.definitions);
            const uniformIpaUs = hasUniformIpaUs(row.word.definitions);
            const showRowBorder =
              row.isLastInWord && rowIndex < rows.length - 1;

            return (
              <tr
                key={getDefinitionRowKey(row)}
                className={showRowBorder ? "border-b border-border" : undefined}
              >
                <td
                  className={classNames(
                    "w-10 px-3 align-middle",
                    getDefinitionRowPadding(row),
                  )}
                >
                  {definition ? (
                    <div className="flex items-center">
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
                      "px-2 py-2 align-middle font-semibold",
                      VOCABULARY_TABLE_COLUMN_WIDTH.word,
                    )}
                    rowSpan={row.definitionCount}
                  >
                    {row.word.word}
                  </td>
                ) : null}
                {row.isFirstInWord && uniformIpaUk && showColumn("ipaUk") ? (
                  <td
                    className={classNames(
                      "px-2 py-2 align-middle",
                      VOCABULARY_TABLE_COLUMN_WIDTH.ipaUk,
                    )}
                    rowSpan={row.definitionCount}
                  >
                    <DefinitionIpaValueCell
                      value={getSharedIpaUk(row.word.definitions)}
                    />
                  </td>
                ) : null}
                {!uniformIpaUk && showColumn("ipaUk") ? (
                  <td
                    className={classNames(
                      "px-2 align-middle",
                      VOCABULARY_TABLE_COLUMN_WIDTH.ipaUk,
                      getDefinitionRowPadding(row),
                    )}
                  >
                    <DefinitionIpaValueCell
                      value={getIpaFieldValue(row.definition, "uk")}
                    />
                  </td>
                ) : null}
                {row.isFirstInWord && uniformIpaUs && showColumn("ipaUs") ? (
                  <td
                    className={classNames(
                      "px-2 py-2 align-middle",
                      VOCABULARY_TABLE_COLUMN_WIDTH.ipaUs,
                    )}
                    rowSpan={row.definitionCount}
                  >
                    <DefinitionIpaValueCell
                      value={getSharedIpaUs(row.word.definitions)}
                    />
                  </td>
                ) : null}
                {!uniformIpaUs && showColumn("ipaUs") ? (
                  <td
                    className={classNames(
                      "px-2 align-middle",
                      VOCABULARY_TABLE_COLUMN_WIDTH.ipaUs,
                      getDefinitionRowPadding(row),
                    )}
                  >
                    <DefinitionIpaValueCell
                      value={getIpaFieldValue(row.definition, "us")}
                    />
                  </td>
                ) : null}
                {showColumn("type") ? (
                <td
                  className={classNames(
                    "px-2 align-middle",
                    VOCABULARY_TABLE_COLUMN_WIDTH.type,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionTypeCell definition={row.definition} />
                </td>
                ) : null}
                {showColumn("meaning") ? (
                <td
                  className={classNames(
                    "px-2 align-middle",
                    VOCABULARY_TABLE_COLUMN_WIDTH.meaning,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionMeaningCell definition={row.definition} />
                </td>
                ) : null}
                {showColumn("level") ? (
                <td
                  className={classNames(
                    "px-2 align-middle",
                    VOCABULARY_TABLE_COLUMN_WIDTH.level,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionLevelCell definition={row.definition} />
                </td>
                ) : null}
                {showColumn("example") ? (
                <td
                  className={classNames(
                    "px-2 align-middle",
                    VOCABULARY_TABLE_COLUMN_WIDTH.example,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionExampleCell definition={row.definition} />
                </td>
                ) : null}
                {showColumn("nextReview") ? (
                <td
                  className={classNames(
                    "px-2 align-middle text-muted-foreground",
                    VOCABULARY_TABLE_COLUMN_WIDTH.nextReview,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionNextReviewCell definition={row.definition} />
                </td>
                ) : null}
                <td
                  className={classNames(
                    "px-2 align-middle",
                    VOCABULARY_TABLE_COLUMN_WIDTH.actions,
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
    return "py-2";
  }

  if (row.isFirstInWord) {
    return "pt-2 pb-0.5";
  }

  if (row.isLastInWord) {
    return "pt-0.5 pb-2";
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
      className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onClick}
    >
      <EditIcon className="size-4" />
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
    <span className="inline-flex rounded-full border border-border px-2 py-1 text-xs">
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

function DefinitionLevelCell({
  definition,
}: {
  definition: VocabWordDefinition | null;
}) {
  if (!definition) {
    return <span className="text-muted-foreground">-</span>;
  }

  return <span>{definition.level}</span>;
}

function DefinitionExampleCell({
  definition,
}: {
  definition: VocabWordDefinition | null;
}) {
  if (!definition) {
    return <span className="text-muted-foreground">-</span>;
  }

  const example = definition.example || definition.exampleVi;

  if (!example) {
    return <span className="text-muted-foreground">-</span>;
  }

  return <p className="min-w-0 break-words">{example}</p>;
}

function DefinitionIpaValueCell({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <p className="break-words text-muted-foreground">{formatIpaDisplay(value)}</p>
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
