export type PartLeftPanel =
  | "audio-image"
  | "audio"
  | "listening-group"
  | "question"
  | "passage";

export type PartTranslationVariant =
  | "options"
  | "question-options"
  | "content-options"
  | "content-question-options";

export type PartPracticeConfig = {
  leftPanel: PartLeftPanel;
  translationVariant: PartTranslationVariant;
  showQuestionInRightPanel: boolean;
};

export const PART_PRACTICE_CONFIG: Record<number, PartPracticeConfig> = {
  1: {
    leftPanel: "audio-image",
    translationVariant: "options",
    showQuestionInRightPanel: false,
  },
  2: {
    leftPanel: "audio",
    translationVariant: "question-options",
    showQuestionInRightPanel: false,
  },
  3: {
    leftPanel: "listening-group",
    translationVariant: "content-question-options",
    showQuestionInRightPanel: true,
  },
  4: {
    leftPanel: "listening-group",
    translationVariant: "content-question-options",
    showQuestionInRightPanel: true,
  },
  5: {
    leftPanel: "question",
    translationVariant: "question-options",
    showQuestionInRightPanel: false,
  },
  6: {
    leftPanel: "passage",
    translationVariant: "content-options",
    showQuestionInRightPanel: false,
  },
  7: {
    leftPanel: "passage",
    translationVariant: "content-question-options",
    showQuestionInRightPanel: true,
  },
};

export function getPartPracticeConfig(partNumber: number): PartPracticeConfig {
  return (
    PART_PRACTICE_CONFIG[partNumber] ?? {
      leftPanel: "question",
      translationVariant: "question-options",
      showQuestionInRightPanel: true,
    }
  );
}

export function isSupportedPracticePart(partNumber: number) {
  return partNumber >= 1 && partNumber <= 7;
}
