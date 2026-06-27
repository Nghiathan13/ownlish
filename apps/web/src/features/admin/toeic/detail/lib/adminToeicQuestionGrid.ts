import type { QuestionGridSection } from "@/features/tests/run/lib/practiceQuestionGrid";
import {
  type AdminToeicRunStep,
  getActiveQuestionIdsForAdminStep,
  getAdminStepQuestions,
} from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";

export function buildAdminToeicGridSections(
  steps: AdminToeicRunStep[],
  activeStep: AdminToeicRunStep | null,
): QuestionGridSection[] {
  const activeQuestionIds = getActiveQuestionIdsForAdminStep(activeStep);
  const sections = new Map<number, QuestionGridSection["cells"]>();

  for (const step of steps) {
    const cells = sections.get(step.partNumber) ?? [];

    for (const question of getAdminStepQuestions(step)) {
      cells.push({
        questionId: question.id,
        displayNumber: question.questionNumber,
        isActive: activeQuestionIds.has(question.id),
        isSelected: false,
        result: null,
      });
    }

    sections.set(step.partNumber, cells);
  }

  return [...sections.entries()]
    .sort(([left], [right]) => left - right)
    .map(([partNumber, cells]) => ({ partNumber, cells }));
}
