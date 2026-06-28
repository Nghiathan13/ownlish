export type PassageInline =
  | { type: "text"; value: string }
  | { type: "evidence"; questionNumbers: number[]; value: string }
  | { type: "bold"; inlines: PassageInline[] };

export type PassageTableCell = {
  widthPercent: number | null;
  center: boolean;
  inlines: PassageInline[];
};

export type PassageTableRow = {
  center: boolean;
  cols: PassageTableCell[];
};

export type PassageTableModifier = "bold" | "center";

export type PassageBlock =
  | { type: "plain"; inlines: PassageInline[] }
  | { type: "center"; inlines: PassageInline[] }
  | {
      type: "table";
      bold: boolean;
      center: boolean;
      rows: PassageTableRow[];
    };

export type ParsePassageContentResult =
  | { kind: "raw"; content: string }
  | { kind: "parsed"; blocks: PassageBlock[] };
