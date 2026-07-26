"use client";

import type { CatalogDefinition, CatalogWord } from "@/entities/collection/api/collections";
import {
  expandCatalogWordsToDefinitionRows,
  type CatalogDefinitionRow,
} from "@/features/collections/detail/system/panel/lib/catalogTableRows";
import {
  formatIpaDisplay,
  getIpaFieldValue,
  getSharedIpaUk,
  getSharedIpaUs,
  hasUniformIpaUk,
  hasUniformIpaUs,
} from "@/features/collections/detail/shared/lib/wordIpa";
import {
  getCatalogTableColumnCount,
  isCatalogColumnVisible,
  type CatalogColumnVisibility,
  type CatalogToggleableColumnId,
} from "@/features/collections/detail/system/panel/lib/catalogTableColumns";
import { TABLE_COLUMN_WIDTH } from "@/features/collections/detail/shared/constants/columnWidths";
import { TableBodyState, TableMobileState } from "@/features/collections/detail/shared/components/TableBodyState";
import { WordsTableDesktopLayout } from "@/features/collections/detail/shared/components/WordsTableDesktopLayout";
import { WordsTableHead } from "@/features/collections/detail/shared/components/WordsTableHead";
import { WordsTableSkeleton } from "@/features/collections/detail/shared/components/WordsTableSkeleton";
import { useWordRowHover } from "@/features/collections/detail/shared/hooks/useWordRowHover";
import { getCatalogWordsTableHeadColumns } from "@/features/collections/detail/shared/lib/wordsTableHeadColumns";
import { formatMessage } from "@/shared/i18n/messages";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { SelectCheckbox } from "@/shared/ui/SelectCheckbox";

type CatalogWordsTableProps = {
  allDefinitionsSelected: boolean;
  className?: string;
  columnVisibility: CatalogColumnVisibility;
  error?: string | null;
  hasSearch?: boolean;
  isLoading?: boolean;
  onRetry?: () => void;
  onToggleAllDefinitions: () => void;
  onToggleDefinition: (definitionId: string) => void;
  selectedDefinitionIds: ReadonlySet<string>;
  someDefinitionsSelected: boolean;
  words: CatalogWord[];
};

export function CatalogWordsTable({
  allDefinitionsSelected,
  className,
  columnVisibility,
  error = null,
  hasSearch = false,
  isLoading = false,
  onRetry,
  onToggleAllDefinitions,
  onToggleDefinition,
  selectedDefinitionIds,
  someDefinitionsSelected,
  words,
}: CatalogWordsTableProps) {
  const t = useT();
  const { hoveredWordId, onWordRowMouseEnter, onWordRowMouseLeave } =
    useWordRowHover();
  const rows = expandCatalogWordsToDefinitionRows(words);
  const showColumn = (columnId: CatalogToggleableColumnId) =>
    isCatalogColumnVisible(columnVisibility, columnId);
  const columnCount = getCatalogTableColumnCount(columnVisibility);
  const showBodyState = isLoading || Boolean(error) || words.length === 0;
  const emptyTitle = hasSearch
    ? t("wordsTable.noMatchingWords")
    : t("wordsTable.noWordsInCollection");
  const emptyDescription = hasSearch
    ? t("wordsTable.tryDifferentSearch")
    : t("wordsTable.noCatalogWordsYet");
  const headColumns = getCatalogWordsTableHeadColumns(columnVisibility, t);
  const mobileScrollClassName = classNames(
    "mx-4 mb-4 grid h-0 min-h-0 min-w-0 flex-1 content-start gap-3 overflow-auto [grid-template-columns:repeat(auto-fit,minmax(max(300px,calc(50%-0.375rem)),1fr))] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:hidden",
    className,
  );

  if (isLoading && !error && words.length === 0) {
    return (
      <WordsTableSkeleton
        className={className}
        columns={headColumns}
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
            loadingMessage={t("wordsTable.loadingWords")}
            onRetry={onRetry}
          />
        ) : (
          rows.map((row) => {
            const { word, definition } = row;

            return (
              <article
                key={getDefinitionRowKey(row)}
                className={classNames(
                  "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4 dark:bg-[#000000]",
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
                    {showColumn("band") && definition?.band ? (
                      <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-sm text-muted-foreground">
                        {definition.band}
                      </span>
                    ) : null}
                    {definition &&
                    selectedDefinitionIds.has(definition.id) ? (
                      <span
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <SelectCheckbox
                          checked
                          label={formatMessage(t("wordsTable.selectWord"), { word: word.word })}
                          onChange={() => onToggleDefinition(definition.id)}
                        />
                      </span>
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
                  <DefinitionMeaningCell definition={definition} />
                ) : null}
                {showColumn("example") ? (
                  <div className="text-muted-foreground">
                    <DefinitionExampleCell definition={definition} />
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
                      TABLE_COLUMN_WIDTH.word,
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
                      TABLE_COLUMN_WIDTH.ipaUk,
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
                      TABLE_COLUMN_WIDTH.ipaUk,
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
                      TABLE_COLUMN_WIDTH.ipaUs,
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
                      TABLE_COLUMN_WIDTH.ipaUs,
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
                    TABLE_COLUMN_WIDTH.type,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionTypeCell definition={row.definition} />
                </td>
                ) : null}
                {showColumn("band") ? (
                <td
                  className={classNames(
                    "px-2 align-middle",
                    TABLE_COLUMN_WIDTH.band,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionBandCell definition={row.definition} />
                </td>
                ) : null}
                {showColumn("meaning") ? (
                <td
                  className={classNames(
                    "px-2 align-middle",
                    TABLE_COLUMN_WIDTH.meaning,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionMeaningCell definition={row.definition} />
                </td>
                ) : null}
                {showColumn("example") ? (
                <td
                  className={classNames(
                    "px-2 align-middle",
                    TABLE_COLUMN_WIDTH.example,
                    getDefinitionRowPadding(row),
                  )}
                >
                  <DefinitionExampleCell definition={row.definition} />
                </td>
                ) : null}
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

function DefinitionBandCell({
  definition,
}: {
  definition: CatalogDefinition | null;
}) {
  if (!definition?.band) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-sm text-muted-foreground">
      {definition.band}
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

  return <p className="min-w-0 break-words">{meaning}</p>;
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
