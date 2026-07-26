import type { ToeicQuestionGroup } from "@/entities/toeic-runtime/model/presentation";

const STATIC_PART_INSTRUCTIONS: Record<number, string> = {
  1: "Select the one statement that best describes what you see in the picture.",
  2: "Select the best response to the question.",
  3: "Select the best response to each question.",
  4: "Select the best response to each question.",
  5: "Select the best answer to complete the sentence.",
};

export function parseGroupTypes(groupType: string | null): string[] {
  const trimmed = groupType?.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      return [trimmed];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [trimmed];
  }
}

export function normalizeGroupTypeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

function pluralizeGroupTypeLabel(label: string, count: number): string {
  return count > 1 ? `${label}s` : label;
}

export function mergeConsecutiveGroupTypes(types: string[]): string[] {
  if (types.length === 0) {
    return [];
  }

  const merged: string[] = [];
  let current = types[0];
  let count = 1;

  for (let index = 1; index < types.length; index += 1) {
    if (types[index] === current) {
      count += 1;
      continue;
    }

    merged.push(pluralizeGroupTypeLabel(current, count));
    current = types[index];
    count = 1;
  }

  merged.push(pluralizeGroupTypeLabel(current, count));
  return merged;
}

export function formatGroupTypeList(types: string[]): string {
  if (types.length === 0) {
    return "";
  }

  if (types.length === 1) {
    return types[0];
  }

  if (types.length === 2) {
    return `${types[0]} and ${types[1]}`;
  }

  return `${types.slice(0, -1).join(", ")} and ${types[types.length - 1]}`;
}

function getReadingPartInstruction(
  group: Pick<ToeicQuestionGroup, "questionStart" | "questionEnd" | "groupType">,
) {
  const range = `Questions ${group.questionStart}-${group.questionEnd}`;
  const types = formatGroupTypeList(
    mergeConsecutiveGroupTypes(
      parseGroupTypes(group.groupType).map(normalizeGroupTypeLabel),
    ),
  );

  if (!types) {
    return `${range} refer to the following.`;
  }

  return `${range} refer to the following ${types}.`;
}

export function getPartInstruction(
  partNumber: number,
  group: Pick<ToeicQuestionGroup, "questionStart" | "questionEnd" | "groupType">,
): string | null {
  const staticInstruction = STATIC_PART_INSTRUCTIONS[partNumber];
  if (staticInstruction) {
    return staticInstruction;
  }

  if (partNumber === 6 || partNumber === 7) {
    return getReadingPartInstruction(group);
  }

  return null;
}
