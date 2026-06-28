import type { AdminGroupEditorState } from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import { createEditorStateFromGroup } from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import {
  parseAdminGroupRawEditDocument,
  serializeAdminGroupRawEditDocument,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditDocument";
import {
  parseAdminGroupRawEditTxt,
  serializeAdminGroupRawEditTxt,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditTxt";
import type {
  AdminGroupRawEditMode,
  AdminGroupRawEditParseResult,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditTypes";
import {
  buildGroupIndexSequence,
  type AdminGroupRange,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditRange";
import {
  getAdminToeicGroupCatalogEntry,
  type AdminToeicGroupCatalogEntry,
} from "@/features/admin/toeic/detail/lib/adminToeicGroupCatalog";

export const GROUP_INDEX_HEADER_PATTERN = /^# groupIndex=(\d+)$/;

export type AdminGroupRawEditParsedItem = {
  groupIndex: number;
  partNumber: number;
  state: AdminGroupEditorState;
};

export type AdminGroupRawEditMultiParseResult =
  | { ok: true; items: AdminGroupRawEditParsedItem[] }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildEditorStateForCatalogEntry(entry: AdminToeicGroupCatalogEntry) {
  return createEditorStateFromGroup(entry.group);
}

export function serializeAdminGroupRawEditRange(
  catalog: AdminToeicGroupCatalogEntry[],
  range: AdminGroupRange,
  mode: AdminGroupRawEditMode,
  stateByGroupId?: Map<number, AdminGroupEditorState>,
) {
  const blocks: string[] = [];

  for (const groupIndex of buildGroupIndexSequence(range)) {
    const entry = getAdminToeicGroupCatalogEntry(catalog, groupIndex);

    if (!entry) {
      continue;
    }

    const state =
      stateByGroupId?.get(entry.group.id) ??
      buildEditorStateForCatalogEntry(entry);

    if (mode === "txt") {
      blocks.push(
        `# groupIndex=${groupIndex}\n${serializeAdminGroupRawEditTxt(state, entry.partNumber)}`.trimEnd(),
      );
      continue;
    }

    const document = JSON.parse(
      serializeAdminGroupRawEditDocument(state, entry.partNumber),
    ) as Record<string, unknown>;

    blocks.push(
      JSON.stringify({ groupIndex, ...document }, null, 2),
    );
  }

  if (mode === "txt") {
    return blocks.length > 0 ? `${blocks.join("\n\n")}\n` : "";
  }

  return `${JSON.stringify(
    blocks.map((block) => JSON.parse(block)),
    null,
    2,
  )}\n`;
}

function splitGroupRawEditTxtBlocks(text: string) {
  const lines = text.split(/\r?\n/);
  const blocks: Array<{ groupIndex: number; body: string }> = [];
  let lineIndex = 0;

  const skipBlankLines = () => {
    while (lineIndex < lines.length && lines[lineIndex]!.trim() === "") {
      lineIndex += 1;
    }
  };

  skipBlankLines();

  while (lineIndex < lines.length) {
    const headerLine = lines[lineIndex]!;
    const headerMatch = headerLine.match(GROUP_INDEX_HEADER_PATTERN);

    if (!headerMatch) {
      return {
        ok: false as const,
        error: `Line ${lineIndex + 1}: expected # groupIndex=N`,
      };
    }

    const groupIndex = Number(headerMatch[1]);
    lineIndex += 1;

    const bodyLines: string[] = [];

    while (lineIndex < lines.length) {
      const line = lines[lineIndex]!;

      if (GROUP_INDEX_HEADER_PATTERN.test(line)) {
        break;
      }

      bodyLines.push(line);
      lineIndex += 1;
    }

    blocks.push({
      groupIndex,
      body: bodyLines.join("\n"),
    });

    skipBlankLines();
  }

  return { ok: true as const, blocks };
}

function validateParsedGroupIndexes(
  parsedIndexes: number[],
  range: AdminGroupRange,
) {
  const expected = buildGroupIndexSequence(range);

  if (parsedIndexes.length !== expected.length) {
    return {
      ok: false as const,
      error: `Expected ${expected.length} group sections for groups ${range.from}-${range.to}.`,
    };
  }

  for (let index = 0; index < expected.length; index += 1) {
    const expectedIndex = expected[index]!;
    const parsedIndex = parsedIndexes[index]!;

    if (parsedIndex !== expectedIndex) {
      return {
        ok: false as const,
        error: `Expected groupIndex=${expectedIndex}, found groupIndex=${parsedIndex}.`,
      };
    }
  }

  return { ok: true as const };
}

function prefixGroupParseError(groupIndex: number, result: AdminGroupRawEditParseResult) {
  if (result.ok) {
    return result;
  }

  return {
    ok: false as const,
    error: `groupIndex=${groupIndex}: ${result.error}`,
  };
}

export function parseAdminGroupRawEditRange(
  text: string,
  catalog: AdminToeicGroupCatalogEntry[],
  range: AdminGroupRange,
  mode: AdminGroupRawEditMode,
): AdminGroupRawEditMultiParseResult {
  if (mode === "txt") {
    const split = splitGroupRawEditTxtBlocks(text);

    if (!split.ok) {
      return split;
    }

    const validation = validateParsedGroupIndexes(
      split.blocks.map((block) => block.groupIndex),
      range,
    );

    if (!validation.ok) {
      return validation;
    }

    const items: AdminGroupRawEditParsedItem[] = [];

    for (const block of split.blocks) {
      const entry = getAdminToeicGroupCatalogEntry(catalog, block.groupIndex);

      if (!entry) {
        return {
          ok: false,
          error: `groupIndex=${block.groupIndex} is not available in this test.`,
        };
      }

      const currentState = buildEditorStateForCatalogEntry(entry);
      const parsed = prefixGroupParseError(
        block.groupIndex,
        parseAdminGroupRawEditTxt(block.body, currentState, entry.partNumber),
      );

      if (!parsed.ok) {
        return parsed;
      }

      items.push({
        groupIndex: block.groupIndex,
        partNumber: entry.partNumber,
        state: parsed.state,
      });
    }

    return { ok: true, items };
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid JSON syntax." };
  }

  if (!Array.isArray(parsedJson)) {
    return { ok: false, error: "Root value must be a JSON array." };
  }

  const validation = validateParsedGroupIndexes(
    parsedJson.map((item) => {
      if (!isRecord(item) || typeof item.groupIndex !== "number") {
        return Number.NaN;
      }

      if (!Number.isInteger(item.groupIndex)) {
        return Number.NaN;
      }

      return item.groupIndex;
    }),
    range,
  );

  if (!validation.ok) {
    return validation;
  }

  const items: AdminGroupRawEditParsedItem[] = [];

  for (let index = 0; index < parsedJson.length; index += 1) {
    const rawItem = parsedJson[index];

    if (!isRecord(rawItem)) {
      return {
        ok: false,
        error: `Item ${index + 1} must be a JSON object.`,
      };
    }

    const groupIndex = rawItem.groupIndex;

    if (typeof groupIndex !== "number" || !Number.isInteger(groupIndex)) {
      return {
        ok: false,
        error: `Item ${index + 1} must include integer groupIndex.`,
      };
    }

    const entry = getAdminToeicGroupCatalogEntry(catalog, groupIndex);

    if (!entry) {
      return {
        ok: false,
        error: `groupIndex=${groupIndex} is not available in this test.`,
      };
    }

    const document = { ...rawItem };
    delete document.groupIndex;
    const currentState = buildEditorStateForCatalogEntry(entry);
    const parsed = prefixGroupParseError(
      groupIndex,
      parseAdminGroupRawEditDocument(
        JSON.stringify(document),
        currentState,
        entry.partNumber,
      ),
    );

    if (!parsed.ok) {
      return parsed;
    }

    items.push({
      groupIndex,
      partNumber: entry.partNumber,
      state: parsed.state,
    });
  }

  return { ok: true, items };
}
