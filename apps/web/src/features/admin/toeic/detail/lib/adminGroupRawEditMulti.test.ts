import { describe, expect, it } from "vitest";
import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { buildAdminToeicGroupCatalog } from "@/features/admin/toeic/detail/lib/adminToeicGroupCatalog";
import { createEditorStateFromGroup } from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import {
  parseAdminGroupRawEditRange,
  serializeAdminGroupRawEditRange,
} from "@/features/admin/toeic/detail/lib/adminGroupRawEditMulti";

const part1Group: AdminToeicTestRawGroup = {
  id: 1,
  questionStart: 1,
  questionEnd: 1,
  groupType: null,
  accent: null,
  content: null,
  contentVi: null,
  audioUrl: null,
  audioUrlExpiresAt: null,
  imageUrl: null,
  imageUrlExpiresAt: null,
  questions: [
    {
      id: 101,
      questionNumber: 1,
      question: "Q1",
      questionVi: null,
      questionType: null,
      optionA: "A",
      optionB: "B",
      optionC: "C",
      optionD: "D",
      optionAVi: null,
      optionBVi: null,
      optionCVi: null,
      optionDVi: null,
      answerKey: "A",
      explanationVi: null,
    },
  ],
};

const part1Group2: AdminToeicTestRawGroup = {
  ...part1Group,
  id: 2,
  questions: [
    {
      ...part1Group.questions[0]!,
      id: 102,
      questionNumber: 2,
      question: "Q2",
      answerKey: "B",
    },
  ],
};

const catalog = buildAdminToeicGroupCatalog([
  {
    partNumber: 1,
    groups: [part1Group, part1Group2],
  },
]);

describe("adminGroupRawEditMulti", () => {
  it("serializes and parses a txt range with groupIndex headers", () => {
    const txt = serializeAdminGroupRawEditRange(catalog, { from: 1, to: 2 }, "txt");

    expect(txt).toContain("# groupIndex=1");
    expect(txt).toContain("# groupIndex=2");

    const parsed = parseAdminGroupRawEditRange(
      txt,
      catalog,
      { from: 1, to: 2 },
      "txt",
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]?.state.draftGroup).toEqual(
      createEditorStateFromGroup(part1Group).draftGroup,
    );
    expect(parsed.items[1]?.state.questions[0]?.draft.answerKey).toBe("B");
  });

  it("serializes and parses a json range array", () => {
    const json = serializeAdminGroupRawEditRange(catalog, { from: 1, to: 1 }, "json");
    const parsed = parseAdminGroupRawEditRange(
      json,
      catalog,
      { from: 1, to: 1 },
      "json",
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.items[0]?.groupIndex).toBe(1);
    expect(parsed.items[0]?.state.questions[0]?.draft.question).toBe("Q1");
  });

  it("rejects txt ranges with the wrong group count", () => {
    const txt = serializeAdminGroupRawEditRange(catalog, { from: 1, to: 1 }, "txt");
    const parsed = parseAdminGroupRawEditRange(
      txt,
      catalog,
      { from: 1, to: 2 },
      "txt",
    );

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.error).toContain("Expected 2 group sections");
  });
});
