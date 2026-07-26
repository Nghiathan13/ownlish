import { describe, expect, it } from "vitest";
import type { ToeicQuestion, ToeicQuestionGroup } from "@/entities/toeic-runtime/model/presentation";
import {
  buildAggregatePracticeRunSteps,
  buildPracticeRunSteps,
} from "@/features/tests/run/lib/practiceRunSteps";
import {
  buildPracticeRunGridSections,
  findStepIndexForQuestion,
  findStepIndexForQuestionId,
  getActiveQuestionIdsForStep,
  getAggregateQuestionGridDisplayNumber,
  getToeicQuestionGridDisplayNumber,
} from "./practiceQuestionGrid";

function makeQuestion(
  id: number,
  questionNumber: number,
  sessionQuestionNumber: number,
): ToeicQuestion {
  return {
    id,
    questionNumber,
    sessionQuestionNumber,
    question: null,
    questionVi: null,
    options: {
      A: null,
      B: null,
      C: null,
      D: null,
      A_vi: null,
      B_vi: null,
      C_vi: null,
      D_vi: null,
    },
    optionCount: 4,
    answerKey: null,
    selectedKey: null,
    status: null,
    isCorrect: null,
  };
}

function makeGroup(
  id: number,
  questions: ToeicQuestion[],
  partNumber = 4,
): ToeicQuestionGroup {
  return {
    id,
    partNumber,
    questionStart: questions[0]?.questionNumber ?? 0,
    questionEnd: questions[questions.length - 1]?.questionNumber ?? 0,
    groupStatus: null,
    groupType: null,
    accent: null,
    content: null,
    contentVi: null,
    audioUrl: null,
    audioUrlExpiresAt: null,
    imageUrl: null,
    imageUrlExpiresAt: null,
    questions,
  };
}

describe("practiceQuestionGrid", () => {
  const aggregateGroups = [
    makeGroup(1, [makeQuestion(101, 71, 1), makeQuestion(102, 72, 2)]),
    makeGroup(2, [makeQuestion(201, 71, 3), makeQuestion(202, 72, 4)]),
  ];
  const aggregateSteps = buildAggregatePracticeRunSteps(4, aggregateGroups);

  it("uses sessionQuestionNumber for aggregate display labels", () => {
    expect(getAggregateQuestionGridDisplayNumber(makeQuestion(201, 71, 3))).toBe(3);
  });

  it("uses TOEIC questionNumber for test-specific and mock display labels", () => {
    const question = makeQuestion(501, 101, 1);

    expect(getToeicQuestionGridDisplayNumber(question)).toBe(101);
  });

  it("shows session numbering in aggregate grid when questionNumber duplicates", () => {
    const activeStep = aggregateSteps[1];
    const activeQuestionIds = getActiveQuestionIdsForStep(activeStep);
    const sections = buildPracticeRunGridSections(
      aggregateSteps,
      [4],
      activeQuestionIds,
      undefined,
      undefined,
      { resolveDisplayLabel: getAggregateQuestionGridDisplayNumber },
    );

    const cells = sections[0]?.cells ?? [];
    const duplicateNumberCells = cells.filter((cell) => cell.displayNumber === 3);

    expect(duplicateNumberCells).toHaveLength(1);
    expect(duplicateNumberCells[0]?.questionId).toBe(201);
    expect(duplicateNumberCells[0]?.isActive).toBe(true);

    const sameNumberOtherGroup = cells.find((cell) => cell.questionId === 101);
    expect(sameNumberOtherGroup?.displayNumber).toBe(1);
    expect(sameNumberOtherGroup?.isActive).toBe(false);
  });

  it("shows TOEIC questionNumber in test-specific grid even with sessionQuestionNumber", () => {
    const part5Groups = [
      makeGroup(
        10,
        [makeQuestion(501, 101, 1), makeQuestion(502, 102, 2)],
        5,
      ),
    ];
    const steps = buildPracticeRunSteps({ 5: part5Groups }, [5]);
    const activeQuestionIds = getActiveQuestionIdsForStep(steps[0]);
    const sections = buildPracticeRunGridSections(steps, [5], activeQuestionIds);

    expect(sections[0]?.cells.map((cell) => cell.displayNumber)).toEqual([101, 102]);
  });

  it("shows TOEIC questionNumber for mock-style grid labels", () => {
    const question = makeQuestion(601, 130, 30);

    expect(getToeicQuestionGridDisplayNumber(question)).toBe(130);
  });

  it("selects steps by questionId instead of duplicate questionNumber", () => {
    expect(findStepIndexForQuestion(aggregateSteps, 71)).toBe(0);
    expect(findStepIndexForQuestionId(aggregateSteps, 201)).toBe(1);
    expect(findStepIndexForQuestionId(aggregateSteps, 101)).toBe(0);
  });
});
