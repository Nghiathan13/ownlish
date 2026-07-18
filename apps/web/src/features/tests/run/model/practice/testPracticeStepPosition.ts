import type { PracticeRunStep } from "@/features/tests/run/lib/practiceRunSteps";

export function resolveInitialTestPracticeStepIndex(
  steps: PracticeRunStep[],
  groupKeyById: Map<number, string>,
  savedGroupKey: string | null,
  selectedParts: number[],
) {
  if (steps.length === 0) {
    return 0;
  }

  const savedStepIndex = steps.findIndex((step) => {
    const group = step.kind === "group" ? step.practiceGroup.group : step.item.group;
    return groupKeyById.get(group.id) === savedGroupKey;
  });
  if (savedStepIndex >= 0) {
    return savedStepIndex;
  }

  const firstSelectedPart = selectedParts[0];
  if (firstSelectedPart == null) {
    return 0;
  }

  const partStartIndex = steps.findIndex(
    (step) => step.partNumber === firstSelectedPart,
  );

  return partStartIndex >= 0 ? partStartIndex : 0;
}
