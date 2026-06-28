export type PassageInline =
  | { type: "text"; value: string }
  | { type: "evidence"; questionNumbers: number[]; value: string }
  | { type: "bold"; inlines: PassageInline[] };

export type PassageTableCell = {
  widthPercent: number | null;
  inlines: PassageInline[];
};

export type PassageTableRow = {
  cols: PassageTableCell[];
};

export type PassageBlock =
  | { type: "plain"; inlines: PassageInline[] }
  | { type: "center"; inlines: PassageInline[] }
  | { type: "table"; rows: PassageTableRow[] };

export type ParsePassageContentResult =
  | { kind: "raw"; content: string }
  | { kind: "parsed"; blocks: PassageBlock[] };
