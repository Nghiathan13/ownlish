import { classNames } from "@/shared/lib/classNames";
import { TABLE_COLUMN_WIDTH } from "@/features/collections/detail/shared/constants/columnWidths";
import { SelectCheckbox } from "@/shared/ui/SelectCheckbox";

export type WordsTableHeadColumn = {
  label: string;
  widthClass: string;
};

type WordsTableHeadProps = {
  columns: WordsTableHeadColumn[];
  actions?: boolean;
  allDefinitionsSelected?: boolean;
  checkbox?: boolean;
  onToggleAllDefinitions?: () => void;
  someDefinitionsSelected?: boolean;
};

const headerCellClassName =
  "sticky top-0 z-10 bg-surface px-2 py-2 align-middle font-semibold shadow-[inset_0_-0.6px_0_0_var(--border)]";
const checkboxHeaderClassName =
  "sticky top-0 z-10 bg-surface w-10 px-3 py-2 align-middle shadow-[inset_0_-0.6px_0_0_var(--border)]";

export function WordsTableHead({
  columns,
  actions = false,
  allDefinitionsSelected = false,
  checkbox = false,
  onToggleAllDefinitions,
  someDefinitionsSelected = false,
}: WordsTableHeadProps) {
  return (
    <thead>
      <tr>
        <th className={checkboxHeaderClassName}>
          {checkbox && onToggleAllDefinitions ? (
            <div className="flex items-center">
              <SelectCheckbox
                checked={allDefinitionsSelected}
                indeterminate={
                  someDefinitionsSelected && !allDefinitionsSelected
                }
                label="Select all definitions on this page"
                onChange={onToggleAllDefinitions}
              />
            </div>
          ) : null}
        </th>
        <th
          className={classNames(headerCellClassName, TABLE_COLUMN_WIDTH.word)}
        >
          Word
        </th>
        {columns.map((column) => (
          <th
            className={classNames(headerCellClassName, column.widthClass)}
            key={column.label}
          >
            {column.label}
          </th>
        ))}
        {actions ? (
          <th
            className={classNames(
              headerCellClassName,
              TABLE_COLUMN_WIDTH.actions,
            )}
          >
            Actions
          </th>
        ) : null}
      </tr>
    </thead>
  );
}
