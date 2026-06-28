export type PassageInline =
  | { type: "text"; value: string }
  | { type: "evidence"; questionNumbers: number[]; value: string }
  | { type: "bold"; inlines: PassageInline[] }
  | { type: "border"; inlines: PassageInline[] };

export type PassageTableCell = {
  border: boolean;
  widthPercent: number | null;
  center: boolean;
  inlines: PassageInline[];
};

export type PassageTableRow = {
  bold: boolean;
  border: boolean;
  center: boolean;
  cols: PassageTableCell[];
};

export type PassageBlock =
  | { type: "plain"; inlines: PassageInline[] }
  | { type: "center"; blocks: PassageBlock[] }
  | {
      type: "table";
      bold: boolean;
      center: boolean;
      widthPercent: number | null;
      rows: PassageTableRow[];
    };

export type ParsePassageContentResult =
  | { kind: "raw"; content: string }
  | { kind: "parsed"; blocks: PassageBlock[] };
