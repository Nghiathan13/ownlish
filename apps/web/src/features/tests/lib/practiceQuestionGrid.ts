import type { QuestionGridResult } from "@/features/tests/lib/practiceAnswers";
import type { FullTestStep } from "@/features/tests/lib/fullTestQuestions";
import type { PracticeGroup, PracticeItem } from "@/features/tests/lib/practiceGroups";

export type QuestionGridCell = {
  questionNumber: number;
  isActive: boolean;
  result: QuestionGridResult;
};

type GetQuestionGridResult = (questionId: number) => QuestionGridResult;

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
): QuestionGridSection {
  return {
    partNumber,
    cells: items.map((item) => ({
      questionNumber: item.question.questionNumber,
      isActive: activeQuestionNumbers.has(item.question.questionNumber),
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

export function findStepIndexForQuestion(steps: FullTestStep[], questionNumber: number) {
  return steps.findIndex((step) =>
    step.kind === "question"
      ? step.item.question.questionNumber === questionNumber
      : step.practiceGroup.questions.some(
          (question) => question.questionNumber === questionNumber,
        ),
  );
}

export function getActiveQuestionNumbersForStep(
  step: FullTestStep | null | undefined,
): Set<number> {
  if (!step) {
    return new Set();
  }

  if (step.kind === "question") {
    return new Set([step.item.question.questionNumber]);
  }

  return new Set(step.practiceGroup.questions.map((question) => question.questionNumber));
}

type GetFullTestQuestionGridResult = (
  questionId: number,
  partNumber: number,
) => QuestionGridResult;

export function buildFullTestGridSections(
  steps: FullTestStep[],
  selectedParts: number[],
  activeQuestionNumbers: ReadonlySet<number>,
  getQuestionResult?: GetFullTestQuestionGridResult,
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
