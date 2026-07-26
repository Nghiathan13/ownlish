import type { ToeicQuestion } from "@/entities/toeic-runtime/model/presentation";
import type { QuestionGridResult } from "@/features/tests/run/lib/practiceAnswers";
import type { PracticeRunStep } from "@/features/tests/run/lib/practiceRunSteps";
import type { PracticeGroup, PracticeItem } from "@/features/tests/run/lib/practiceGroups";

export type QuestionGridCell = {
  questionId: number;
  displayNumber: number;
  isActive: boolean;
  isSelected: boolean;
  result: QuestionGridResult;
};

type GetQuestionGridResult = (questionId: number) => QuestionGridResult;
type GetQuestionGridSelected = (questionId: number) => boolean;

export type QuestionGridLabelResolver = (question: {
  id: number;
  questionNumber: number;
  sessionQuestionNumber?: number | null;
}) => number;

export function getToeicQuestionGridDisplayNumber(question: {
  questionNumber: number;
  sessionQuestionNumber?: number | null;
}) {
  return question.questionNumber;
}

export function getAggregateQuestionGridDisplayNumber(question: {
  questionNumber: number;
  sessionQuestionNumber?: number | null;
}) {
  return question.sessionQuestionNumber ?? question.questionNumber;
}

/** @deprecated Use getAggregateQuestionGridDisplayNumber or getToeicQuestionGridDisplayNumber. */
export function getQuestionGridDisplayNumber(question: {
  questionNumber: number;
  sessionQuestionNumber?: number | null;
}) {
  return getAggregateQuestionGridDisplayNumber(question);
}

const DEFAULT_GRID_LABEL_RESOLVER: QuestionGridLabelResolver = (question) =>
  getToeicQuestionGridDisplayNumber(question);

function resolveCellResult(
  questionId: number,
  getQuestionResult?: GetQuestionGridResult,
): QuestionGridResult {
  return getQuestionResult?.(questionId) ?? null;
}

function buildGridCell(
  question: ToeicQuestion,
  activeQuestionIds: ReadonlySet<number>,
  resolveDisplayLabel: QuestionGridLabelResolver = DEFAULT_GRID_LABEL_RESOLVER,
  getQuestionResult?: GetQuestionGridResult,
  getQuestionSelected?: GetQuestionGridSelected,
): QuestionGridCell {
  return {
    questionId: question.id,
    displayNumber: resolveDisplayLabel(question),
    isActive: activeQuestionIds.has(question.id),
    isSelected: getQuestionSelected?.(question.id) ?? false,
    result: resolveCellResult(question.id, getQuestionResult),
  };
}

export type QuestionGridSection = {
  partNumber: number;
  cells: QuestionGridCell[];
};

export function buildItemGridSection(
  partNumber: number,
  items: PracticeItem[],
  activeQuestionIds: ReadonlySet<number>,
  options?: {
    resolveDisplayLabel?: QuestionGridLabelResolver;
    getQuestionResult?: GetQuestionGridResult;
    getQuestionSelected?: GetQuestionGridSelected;
  },
): QuestionGridSection {
  return {
    partNumber,
    cells: items.map((item) =>
      buildGridCell(
        item.question,
        activeQuestionIds,
        options?.resolveDisplayLabel,
        options?.getQuestionResult,
        options?.getQuestionSelected,
      ),
    ),
  };
}

export function buildGroupGridSection(
  partNumber: number,
  groups: PracticeGroup[],
  activeQuestionIds: ReadonlySet<number>,
  options?: {
    shouldIncludeQuestion?: (questionId: number) => boolean;
    resolveDisplayLabel?: QuestionGridLabelResolver;
    getQuestionResult?: GetQuestionGridResult;
    getQuestionSelected?: GetQuestionGridSelected;
  },
): QuestionGridSection {
  const cells: QuestionGridCell[] = [];

  for (const group of groups) {
    for (const question of group.questions) {
      if (options?.shouldIncludeQuestion && !options.shouldIncludeQuestion(question.id)) {
        continue;
      }

      cells.push(
        buildGridCell(
          question,
          activeQuestionIds,
          options?.resolveDisplayLabel,
          options?.getQuestionResult,
          options?.getQuestionSelected,
        ),
      );
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

export function findStepIndexForQuestionId(
  steps: PracticeRunStep[],
  questionId: number,
) {
  return steps.findIndex((step) =>
    step.kind === "question"
      ? step.item.question.id === questionId
      : step.practiceGroup.questions.some((question) => question.id === questionId),
  );
}

export function getActiveQuestionIdsForStep(
  step: PracticeRunStep | null | undefined,
): Set<number> {
  if (!step) {
    return new Set();
  }

  if (step.kind === "question") {
    return new Set([step.item.question.id]);
  }

  return new Set(step.practiceGroup.questions.map((question) => question.id));
}

/** @deprecated Use getActiveQuestionIdsForStep for grid active state. */
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
  activeQuestionIds: ReadonlySet<number>,
  getQuestionResult?: GetPracticeRunQuestionGridResult,
  getQuestionSelected?: GetPracticeRunQuestionGridSelected,
  options?: {
    resolveDisplayLabel?: QuestionGridLabelResolver;
  },
): QuestionGridSection[] {
  const resolveDisplayLabel =
    options?.resolveDisplayLabel ?? DEFAULT_GRID_LABEL_RESOLVER;
  const sections: QuestionGridSection[] = [];

  for (const partNumber of selectedParts) {
    const cells: QuestionGridCell[] = [];

    for (const step of steps) {
      if (step.partNumber !== partNumber) {
        continue;
      }

      if (step.kind === "question") {
        cells.push(
          buildGridCell(
            step.item.question,
            activeQuestionIds,
            resolveDisplayLabel,
            (questionId) => getQuestionResult?.(questionId, step.partNumber) ?? null,
            (questionId) => getQuestionSelected?.(questionId, step.partNumber) ?? false,
          ),
        );
        continue;
      }

      for (const question of step.practiceGroup.questions) {
        cells.push(
          buildGridCell(
            question,
            activeQuestionIds,
            resolveDisplayLabel,
            (questionId) => getQuestionResult?.(questionId, step.partNumber) ?? null,
            (questionId) => getQuestionSelected?.(questionId, step.partNumber) ?? false,
          ),
        );
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
