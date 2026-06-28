import { classNames } from "@/shared/lib/classNames";
import { PassageInlines } from "@/features/tests/run/components/PassageInlines";
import type { PassageTableRow } from "@/features/tests/run/lib/passageContent.types";
import { getTableColumnStyle } from "@/features/tests/run/lib/parsePassageTable";

type PassageTableViewProps = {
  bold: boolean;
  center: boolean;
  highlightEvidence: boolean;
  rows: PassageTableRow[];
  stripEvidence: boolean;
};

export function PassageTableView({
  bold,
  center,
  highlightEvidence,
  rows,
  stripEvidence,
}: PassageTableViewProps) {
  return (
    <div
      className={classNames(
        "block w-full space-y-3",
        bold && "font-semibold",
      )}
    >
      {rows.map((row, rowIndex) => {
        const rowCentered = center || row.center;

        return (
        <div
          className={classNames("flex w-full flex-wrap", rowCentered && "text-center")}
          key={`row-${rowIndex}`}
        >
          {row.cols.map((col, colIndex) => {
            const columnStyle = getTableColumnStyle(col, row.cols);

            return (
              <div
                className={classNames(
                  "min-w-0 max-w-full shrink whitespace-pre-wrap break-words",
                  (rowCentered || col.center) && "text-center",
                )}
                key={`col-${rowIndex}-${colIndex}`}
                style={{
                  flexBasis: columnStyle.flexBasis,
                  flexGrow: columnStyle.flexGrow,
                  flexShrink: 1,
                }}
              >
                <PassageInlines
                  highlightEvidence={highlightEvidence}
                  inlines={col.inlines}
                  stripEvidence={stripEvidence}
                />
              </div>
            );
          })}
        </div>
        );
      })}
    </div>
  );
}
