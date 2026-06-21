import type { QuestionGridResult } from "@/features/tests/run/lib/practiceAnswers";
import type { PracticeRunStep } from "@/features/tests/run/lib/practiceRunSteps";
import type { PracticeGroup, PracticeItem } from "@/features/tests/run/lib/practiceGroups";

export type QuestionGridCell = {
  questionNumber: number;
  isActive: boolean;
  isSelected: boolean;
  result: QuestionGridResult;
};

type GetQuestionGridResult = (questionId: number) => QuestionGridResult;
type GetQuestionGridSelected = (questionId: number) => boolean;

function resolveCellResult(
  questionId: number,
  getQuestionResult?: GetQuestionGridResult,
): QuestionGridResult {
  return getQuestionResult?.(questionId) ?? null;
}

export type QuestionGridSection = {
  partNumber: number;
  cells: QuestionGridCell[];
};

export function buildItemGridSection(
  partNumber: number,
  items: PracticeItem[],
  activeQuestionNumbers: ReadonlySet<number>,
  getQuestionResult?: GetQuestionGridResult,
  getQuestionSelected?: GetQuestionGridSelected,
): QuestionGridSection {
  return {
    partNumber,
    cells: items.map((item) => ({
      questionNumber: item.question.questionNumber,
      isActive: activeQuestionNumbers.has(item.question.questionNumber),
      isSelected: getQuestionSelected?.(item.question.id) ?? false,
      result: resolveCellResult(item.question.id, getQuestionResult),
    })),
  };
}

export function buildGroupGridSection(
  partNumber: number,
  groups: PracticeGroup[],
  activeQuestionNumbers: ReadonlySet<number>,
  shouldIncludeQuestion?: (questionId: number) => boolean,
  getQuestionResult?: GetQuestionGridResult,
  getQuestionSelected?: GetQuestionGridSelected,
): QuestionGridSection {
  const cells: QuestionGridCell[] = [];

  for (const group of groups) {
    for (const question of group.questions) {
      if (shouldIncludeQuestion && !shouldIncludeQuestion(question.id)) {
        continue;
      }

      cells.push({
        questionNumber: question.questionNumber,
        isActive: activeQuestionNumbers.has(question.questionNumber),
        isSelected: getQuestionSelected?.(question.id) ?? false,
        result: resolveCellResult(question.id, getQuestionResult),
      });
    }
  }

  return {
    partNumber,
    cells,
  };
}

export function findGroupIndexForQuestion(
  groups: PracticeGroup[],
  questionNumber: number,
) {
  return groups.findIndex((group) =>
    group.questions.some((question) => question.questionNumber === questionNumber),
  );
}

export function findItemIndexForQuestion(items: PracticeItem[], questionNumber: number) {
  return items.findIndex((item) => item.question.questionNumber === questionNumber);
}

export function findStepIndexForQuestion(steps: PracticeRunStep[], questionNumber: number) {
  return steps.findIndex((step) =>
    step.kind === "question"
      ? step.item.question.questionNumber === questionNumber
      : step.practiceGroup.questions.some(
          (question) => question.questionNumber === questionNumber,
        ),
  );
}

export function getActiveQuestionNumbersForStep(
  step: PracticeRunStep | null | undefined,
): Set<number> {
  if (!step) {
    return new Set();
  }

  if (step.kind === "question") {
    return new Set([step.item.question.questionNumber]);
  }

  return new Set(step.practiceGroup.questions.map((question) => question.questionNumber));
}

type GetPracticeRunQuestionGridResult = (
  questionId: number,
  partNumber: number,
) => QuestionGridResult;
type GetPracticeRunQuestionGridSelected = (
  questionId: number,
  partNumber: number,
) => boolean;

export function buildPracticeRunGridSections(
  steps: PracticeRunStep[],
  selectedParts: number[],
  activeQuestionNumbers: ReadonlySet<number>,
  getQuestionResult?: GetPracticeRunQuestionGridResult,
  getQuestionSelected?: GetPracticeRunQuestionGridSelected,
): QuestionGridSection[] {
  const sections: QuestionGridSection[] = [];

  for (const partNumber of selectedParts) {
    const cells: QuestionGridCell[] = [];

    for (const step of steps) {
      if (step.partNumber !== partNumber) {
        continue;
      }

      if (step.kind === "question") {
        cells.push({
          questionNumber: step.item.question.questionNumber,
          isActive: activeQuestionNumbers.has(step.item.question.questionNumber),
          isSelected: getQuestionSelected
            ? getQuestionSelected(step.item.question.id, step.partNumber)
            : false,
          result: getQuestionResult
            ? getQuestionResult(step.item.question.id, step.partNumber)
            : null,
        });
        continue;
      }

      for (const question of step.practiceGroup.questions) {
        cells.push({
          questionNumber: question.questionNumber,
          isActive: activeQuestionNumbers.has(question.questionNumber),
          isSelected: getQuestionSelected
            ? getQuestionSelected(question.id, step.partNumber)
            : false,
          result: getQuestionResult
            ? getQuestionResult(question.id, step.partNumber)
            : null,
        });
      }
    }

    if (cells.length > 0) {
      sections.push({ partNumber, cells });
    }
  }

  return sections;
}

export function getTotalQuestionCountFromSections(sections: QuestionGridSection[]) {
  return sections.reduce((total, section) => total + section.cells.length, 0);
}
