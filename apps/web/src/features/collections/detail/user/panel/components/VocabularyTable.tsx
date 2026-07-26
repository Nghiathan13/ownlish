"use client";

import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
import {
  expandWordsToDefinitionRows,
  type VocabularyDefinitionRow,
} from "@/features/collections/detail/user/panel/lib/vocabularyTableRows";
import {
  formatIpaDisplay,
  getIpaFieldValue,
  getSharedIpaUk,
  getSharedIpaUs,
  hasUniformIpaUk,
  hasUniformIpaUs,
} from "@/features/collections/detail/shared/lib/wordIpa";
import {
  getVocabularyTableColumnCount,
  isColumnVisible,
  VOCABULARY_TABLE_COLUMN_WIDTH,
  type VocabularyColumnVisibility,
  type VocabularyToggleableColumnId,
} from "@/features/collections/detail/user/panel/lib/vocabularyTableColumns";
import { TableBodyState, TableMobileState } from "@/features/collections/detail/shared/components/TableBodyState";
import { WordsTableDesktopLayout } from "@/features/collections/detail/shared/components/WordsTableDesktopLayout";
import { WordsTableHead } from "@/features/collections/detail/shared/components/WordsTableHead";
import { WordsTableSkeleton } from "@/features/collections/detail/shared/components/WordsTableSkeleton";
import { useWordRowHover } from "@/features/collections/detail/shared/hooks/useWordRowHover";
import { getVocabularyWordsTableHeadColumns } from "@/features/collections/detail/shared/lib/wordsTableHeadColumns";
import { formatMessage } from "@/shared/i18n/messages";
import { classNames } from "@/shared/lib/classNames";
import { formatDisplayDate } from "@/shared/lib/date";
import { useLocale, useT } from "@/shared/providers/LocaleProvider";
import { EditIcon } from "@/shared/ui/icons/EditIcon";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { SelectCheckbox } from "@/shared/ui/SelectCheckbox";

type VocabularyTableProps = {
  allDefinitionsSelected: boolean;
  className?: string;
  columnVisibility: VocabularyColumnVisibility;
  error?: string | null;
  hasSearch?: boolean;
  isLoading?: boolean;
  onEdit: (word: VocabWord, definition: VocabWordDefinition | null) => void;
  onRetry?: () => void;
  onToggleAllDefinitions: () => void;
  onToggleDefinition: (definitionId: string) => void;
  selectedDefinitionIds: ReadonlySet<string>;
  someDefinitionsSelected: boolean;
  words: VocabWord[];
};

export function VocabularyTable({
  allDefinitionsSelected,
  className,
  columnVisibility,
  error = null,
  hasSearch = false,
  isLoading = false,
  onEdit,
  onRetry,
  onToggleAllDefinitions,
  onToggleDefinition,
  selectedDefinitionIds,
  someDefinitionsSelected,
  words,
}: VocabularyTableProps) {
  const t = useT();
  const { hoveredWordId, onWordRowMouseEnter, onWordRowMouseLeave } =
    useWordRowHover();
  const rows = expandWordsToDefinitionRows(words);
  const showColumn = (columnId: VocabularyToggleableColumnId) =>
    isColumnVisible(columnVisibility, columnId);
  const columnCount = getVocabularyTableColumnCount(columnVisibility);
  const showBodyState = isLoading || Boolean(error) || words.length === 0;
  const emptyTitle = hasSearch
    ? t("wordsTable.noMatchingWords")
    : t("wordsTable.noVocabularyYet");
  const emptyDescription = hasSearch
    ? t("wordsTable.tryDifferentSearch")
    : t("wordsTable.addFirstWord");
  const headColumns = getVocabularyWordsTableHeadColumns(columnVisibility, t);
  const mobileScrollClassName = classNames(
    "mx-4 mb-4 grid h-0 min-h-0 min-w-0 flex-1 content-start gap-3 overflow-auto [grid-template-columns:repeat(auto-fit,minmax(max(300px,calc(50%-0.375rem)),1fr))] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:hidden",
    className,
  );

  if (isLoading && !error && words.length === 0) {
    return (
      <WordsTableSkeleton
        className={className}
        columns={headColumns}
        showActions
      />
    );
  }

  return (
    <>
      <div className={mobileScrollClassName}>
        {showBodyState ? (
          <TableMobileState
            emptyDescription={emptyDescription}
            emptyTitle={emptyTitle}
            error={error}
            isEmpty={words.length === 0}
            isLoading={isLoading}
            onRetry={onRetry}
          />
        ) : (
          rows.map((row) => {
            const { word, definition } = row;

            return (
              <article
                key={getDefinitionRowKey(row)}
                className={classNames(
                  "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4",
                  definition && "cursor-pointer",
                )}
                onClick={
                  definition
                    ? () => onToggleDefinition(definition.id)
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <h2 className="min-w-0 truncate text-base font-semibold">
                    {word.word}
                  </h2>
                  {showColumn("type") ? (
                    <DefinitionTypeCell definition={definition} />
                  ) : null}
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    {definition?.band ? (
                      <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-sm text-muted-foreground">
                        {definition.band}
                      </span>
                    ) : null}
                    {definition ? (
                      <>
                        {selectedDefinitionIds.has(definition.id) ? (
                          <span
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <SelectCheckbox
                              checked
                              label={formatMessage(t("wordsTable.selectWord"), { word: word.word })}
                              onChange={() =>
                                onToggleDefinition(definition.id)
                              }
                            />
                          </span>
                        ) : null}
                        <span
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <EditDefinitionButton
                            label={formatMessage(t("wordsTable.editWordAria"), { word: word.word })}
                            onClick={() => onEdit(word, definition)}
                          />
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {(showColumn("ipaUk") || showColumn("ipaUs")) &&
                (getIpaFieldValue(definition, "uk") ||
                  getIpaFieldValue(definition, "us")) ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-base text-muted-foreground">
                    {showColumn("ipaUk") ? (
                      <span className="inline-flex items-baseline gap-1">
                        <span>UK:</span>
                        <DefinitionIpaValueCell
                          value={getIpaFieldValue(definition, "uk")}
                        />
                      </span>
                    ) : null}
                    {showColumn("ipaUs") ? (
                      <span className="inline-flex items-baseline gap-1">
                        <span>US:</span>
                        <DefinitionIpaValueCell
                          value={getIpaFieldValue(definition, "us")}
                        />
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {showColumn("meaning") ? (
                  <DefinitionMeaningCell
                    definition={definition}
                    showBand={false}
                  />
                ) : null}
                {showColumn("level") ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("wordsTable.level")}
                    </dt>
                    <dd className="mt-1">
                      <DefinitionLevelCell definition={definition} />
                    </dd>
                  </div>
                ) : null}
                {showColumn("example") ? (
                  <div className="text-muted-foreground">
                    <DefinitionExampleCell definition={definition} />
                  </div>
                ) : null}
                {showColumn("nextReview") ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("wordsTable.nextReview")}
                    </dt>
                    <dd className="mt-1 text-muted-foreground">
                      <DefinitionNextReviewCell definition={definition} />
                    </dd>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      <WordsTableDesktopLayout
        className={className}
        head={
          <WordsTableHead
            columns={headColumns}
            actions
            allDefinitionsSelected={allDefinitionsSelected}
            checkbox
            onToggleAllDefinitions={onToggleAllDefinitions}
            someDefinitionsSelected={someDefinitionsSelected}
          />
        }
        body={
          showBodyState ? (
            <TableBodyState
              columnCount={columnCount}
              emptyDescription={emptyDescription}
              emptyTitle={emptyTitle}
              error={error}
              isEmpty={words.length === 0}
              isLoading={isLoading}
              loadingMessage={t("wordsTable.loadingWords")}
              onRetry={onRetry}
            />
          ) : (
            rows.map((row, rowIndex) => {
            const definition = row.definition;
            const uniformIpaUk = hasUniformIpaUk(row.word.definitions);
            const uniformIpaUs = hasUniformIpaUs(row.word.definitions);
            const showRowBorder =
              row.isLastInWord && rowIndex < rows.length - 1;

            return (
              <tr
                key={getDefinitionRowKey(row)}
                data-word-id={row.word.id}
                className={classNames(
                  hoveredWordId === row.word.id && "bg-hover-overlay",
                  showRowBorder && "border-b border-border",
                )}
                onMouseEnter={() => onWordRowMouseEnter(row.word.id)}
                onMouseLeave={(event) =>
                  onWordRowMouseLeave(event, row.word.id)
                }
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
                        label={formatMessage(t("wordsTable.selectWord"), { word: row.word.word })}
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
                      label={formatMessage(t("wordsTable.editWordAria"), { word: row.word.word })}
                      onClick={() => onEdit(row.word, definition)}
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            );
          })
          )
        }
      />
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
      className={iconOnlyButtonClassName(
        "bg-transparent text-foreground hover:bg-hover-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      onClick={onClick}
    >
      <EditIcon />
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
    <span className="inline-flex rounded-full border border-border px-2 py-1 text-sm">
      {definition.type}
    </span>
  );
}

function DefinitionMeaningCell({
  definition,
  showBand = true,
}: {
  definition: VocabWordDefinition | null;
  showBand?: boolean;
}) {
  if (!definition) {
    return <span className="text-muted-foreground">-</span>;
  }

  const meaning = definition.meaningVi || definition.definition || "-";

  return (
    <div className="flex items-start justify-between gap-3">
      <p className="min-w-0 flex-1 break-words">{meaning}</p>
      {showBand && definition.band ? (
        <span className="inline-flex shrink-0 rounded-full border border-border px-2 py-0.5 text-sm text-muted-foreground">
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
  const t = useT();
  const { locale } = useLocale();

  if (!definition) {
    return <span>-</span>;
  }

  return (
    <span>
      {formatDisplayDate(definition.nextReview, locale) ??
        t("wordsTable.notScheduled")}
    </span>
  );
}
