import { PassageInlines } from "@/features/tests/run/components/PassageInlines";
import type { PassageTableRow } from "@/features/tests/run/lib/passageContent.types";
import { getTableColumnStyle } from "@/features/tests/run/lib/parsePassageTable";

type PassageTableViewProps = {
  highlightEvidence: boolean;
  rows: PassageTableRow[];
  stripEvidence: boolean;
};

export function PassageTableView({
  highlightEvidence,
  rows,
  stripEvidence,
}: PassageTableViewProps) {
  return (
    <div className="block w-full space-y-3">
      {rows.map((row, rowIndex) => (
        <div className="flex w-full flex-wrap" key={`row-${rowIndex}`}>
          {row.cols.map((col, colIndex) => {
            const columnStyle = getTableColumnStyle(col, row.cols);

            return (
              <div
                className="min-w-0 max-w-full shrink whitespace-pre-wrap break-words"
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
      ))}
    </div>
  );
}
