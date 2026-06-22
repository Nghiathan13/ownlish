import type { CatalogDefinition, CatalogWord } from "@/entities/collection/api/collections";
import {
  expandCatalogWordsToDefinitionRows,
  type CatalogDefinitionRow,
} from "@/features/collections/lib/catalogTableRows";
import {
  formatIpaDisplay,
  getIpaFieldValue,
  getSharedIpaUk,
  getSharedIpaUs,
  hasUniformIpaUk,
  hasUniformIpaUs,
} from "@/features/collections/words/lib/vocabularyIpa";
import { VOCABULARY_TABLE_COLUMN_WIDTH } from "@/features/collections/words/lib/vocabularyTableColumns";
import { classNames } from "@/shared/lib/classNames";
import { SelectCheckbox } from "@/shared/ui/SelectCheckbox";

type CatalogWordsTableProps = {
  words: CatalogWord[];
};

export function CatalogWordsTable({ words }: CatalogWordsTableProps) {
  const rows = expandCatalogWordsToDefinitionRows(words);

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {words.map((word) => {
          const wordRows = expandCatalogWordsToDefinitionRows([word]);
          const uniformIpaUk = hasUniformIpaUk(word.definitions);
          const uniformIpaUs = hasUniformIpaUs(word.definitions);
          const showHeaderIpa = uniformIpaUk || uniformIpaUs;

          return (
            <article
              key={word.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold">{word.word}</h2>
                {showHeaderIpa ? (
                  <div className="grid shrink-0 gap-0.5 text-right text-base text-muted-foreground">
                    {uniformIpaUk ? (
                      <DefinitionIpaValueCell
                        value={getSharedIpaUk(word.definitions)}
                      />
                    ) : null}
                    {uniformIpaUs ? (
                      <DefinitionIpaValueCell
                        value={getSharedIpaUs(word.definitions)}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="text-base">
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
                        <PlaceholderSelectCheckbox
                          label={`Select ${word.word}`}
                        />
                      ) : null}
                      {!uniformIpaUk ? (
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
                      {!uniformIpaUs ? (
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
                        <div className="col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Example
                          </dt>
                          <dd className="mt-1">
                            <DefinitionExampleCell definition={row.definition} />
                          </dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <table className="hidden w-full min-w-[920px] table-fixed border-collapse text-left text-base md:table">
        <thead className="sticky top-0 z-10 bg-surface shadow-[0_0.5px_0_0_var(--border)] [transform:translateZ(0)]">
          <tr>
            <th className="w-10 bg-surface px-3 py-3 align-middle">
              <div className="flex items-center">
                <PlaceholderSelectCheckbox label="Select all definitions on this page" />
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
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.ipaUk,
              )}
            >
              IPA UK
            </th>
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.ipaUs,
              )}
            >
              IPA US
            </th>
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.type,
              )}
            >
              Type
            </th>
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.meaning,
              )}
            >
              Meaning
            </th>
            <th
              className={classNames(
                "bg-surface px-2 py-2 align-middle font-semibold",
                VOCABULARY_TABLE_COLUMN_WIDTH.example,
              )}
            >
              Example
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
                      <PlaceholderSelectCheckbox
                        label={`Select ${row.word.word}`}
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
                {row.isFirstInWord && uniformIpaUk ? (
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
                {!uniformIpaUk ? (
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
                {row.isFirstInWord && uniformIpaUs ? (
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
                {!uniformIpaUs ? (
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
                <td
                  className={classNames(
                    "px-2 align-middle",
                    VOCABULARY_TABLE_COLUMN_WIDTH.type,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionTypeCell definition={row.definition} />
                </td>
                <td
                  className={classNames(
                    "px-2 align-middle",
                    VOCABULARY_TABLE_COLUMN_WIDTH.meaning,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionMeaningCell definition={row.definition} />
                </td>
                <td
                  className={classNames(
                    "px-2 align-middle",
                    VOCABULARY_TABLE_COLUMN_WIDTH.example,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionExampleCell definition={row.definition} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function PlaceholderSelectCheckbox({ label }: { label: string }) {
  return (
    <SelectCheckbox checked={false} label={label} onChange={() => undefined} />
  );
}

function getDefinitionRowKey(row: {
  word: CatalogWord;
  definition: CatalogDefinition | null;
  definitionIndex: number;
}) {
  return `${row.word.id}-${row.definition?.id ?? "empty"}-${row.definitionIndex}`;
}

function getDefinitionRowPadding(
  row: Pick<CatalogDefinitionRow, "isFirstInWord" | "isLastInWord">,
) {
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

function DefinitionTypeCell({
  definition,
}: {
  definition: CatalogDefinition | null;
}) {
  if (!definition?.type) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span className="inline-flex rounded-full border border-border px-2 py-1 text-sm">
      {definition.type}
    </span>
  );
}

function DefinitionMeaningCell({
  definition,
}: {
  definition: CatalogDefinition | null;
}) {
  if (!definition) {
    return <span className="text-muted-foreground">-</span>;
  }

  const meaning = definition.meaningVi || definition.definition || "-";

  return (
    <div className="flex items-start justify-between gap-3">
      <p className="min-w-0 flex-1 break-words">{meaning}</p>
      {definition.band ? (
        <span className="inline-flex shrink-0 rounded-full border border-border px-2 py-0.5 text-sm text-muted-foreground">
          {definition.band}
        </span>
      ) : null}
    </div>
  );
}

function DefinitionExampleCell({
  definition,
}: {
  definition: CatalogDefinition | null;
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
