import { describe, expect, it } from "vitest";
import type { ToeicQuestion } from "@/entities/toeic/api/types";
import type { PartPracticeConfig } from "@/features/tests/shared/constants/partPracticeConfig";
import { getPracticeQuestionPresentation } from "@/features/tests/run/lib/practiceQuestionPresentation";

const partConfig: PartPracticeConfig = {
  leftPanel: "listening-group",
  translationVariant: "content-question-options",
  showQuestionInRightPanel: true,
  navigationMode: "per-group",
  showOptionTextBeforeAnswer: true,
  hideContextUntilGroupComplete: true,
  contentLayout: "split-plain",
};

const question: ToeicQuestion = {
  id: 101,
  questionNumber: 1,
  sessionQuestionNumber: 1,
  question: "Choose an answer.",
  questionVi: null,
  options: {
    A: "Alpha",
    B: "Beta",
    C: null,
    D: null,
    A_vi: null,
    B_vi: null,
    C_vi: null,
    D_vi: null,
  },
  optionCount: 2,
  answerKey: "A",
  selectedKey: "B",
  status: "selected",
  isCorrect: null,
};

describe("getPracticeQuestionPresentation", () => {
  it("locks a pending deferred group without revealing its answer", () => {
    const presentation = getPracticeQuestionPresentation({
      answer: question,
      isBilingual: false,
      isDeferredGroupPending: true,
      localSelectedKey: null,
      partConfig,
      question,
      showGroupReveal: false,
      usesDeferredGroupGrading: true,
    });

    expect(presentation).toMatchObject({
      answerKey: null,
      isLocked: true,
      selectedKey: "B",
      showResult: false,
      translationVisible: false,
    });
  });
});
