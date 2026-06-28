import { classNames } from "@/shared/lib/classNames";
import { PassageInlines } from "@/features/tests/run/components/PassageInlines";
import type { PassageTableRow } from "@/features/tests/run/lib/passageContent.types";
import { getTableColumnStyle } from "@/features/tests/run/lib/parsePassageTable";

type PassageTableViewProps = {
  blockCenter?: boolean;
  bold: boolean;
  center: boolean;
  highlightEvidence: boolean;
  rows: PassageTableRow[];
  stripEvidence: boolean;
  widthPercent: number | null;
};

export function PassageTableView({
  blockCenter = false,
  bold,
  center,
  highlightEvidence,
  rows,
  stripEvidence,
  widthPercent,
}: PassageTableViewProps) {
  const shrinkToContent = blockCenter && widthPercent == null;

  return (
    <div
      className={classNames(
        "block space-y-3",
        shrinkToContent ? "w-auto max-w-full" : widthPercent == null && "w-full",
        bold && "font-bold",
      )}
      style={
        widthPercent != null
          ? { maxWidth: "100%", width: `${widthPercent}%` }
          : undefined
      }
    >
      {rows.map((row, rowIndex) => {
        const rowCentered = center || row.center;
        const rowBold = bold || row.bold;

        return (
        <div
          className={classNames(
            "flex flex-wrap",
            shrinkToContent ? "w-auto max-w-full" : "w-full",
            rowCentered && "text-center",
            rowBold && "font-bold",
          )}
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
