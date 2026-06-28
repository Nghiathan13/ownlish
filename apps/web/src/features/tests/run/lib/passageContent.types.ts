export type PassageInline =
  | { type: "text"; value: string }
  | { type: "evidence"; questionNumbers: number[]; value: string }
  | { type: "bold"; inlines: PassageInline[] };

export type PassageBlock =
  | { type: "plain"; inlines: PassageInline[] }
  | { type: "center"; inlines: PassageInline[] };

export type ParsePassageContentResult =
  | { kind: "raw"; content: string }
  | { kind: "parsed"; blocks: PassageBlock[] };
