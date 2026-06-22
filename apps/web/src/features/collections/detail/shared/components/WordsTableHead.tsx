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

const headerCellClassName = "bg-surface px-2 py-2 align-middle font-semibold";
const checkboxHeaderClassName = "bg-surface w-10 px-3 py-3 align-middle";

export function WordsTableHead({
  columns,
  actions = false,
  allDefinitionsSelected = false,
  checkbox = false,
  onToggleAllDefinitions,
  someDefinitionsSelected = false,
}: WordsTableHeadProps) {
  return (
    <thead
      className="sticky top-0 z-10 bg-surface shadow-[0_0.5px_0_0_var(--border)] [transform:translateZ(0)]"
    >
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
