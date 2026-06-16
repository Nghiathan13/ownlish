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
  navigationMode: "per-question" | "per-group";
  showOptionTextBeforeAnswer: boolean;
  hideContextUntilGroupComplete: boolean;
};

export const PART_PRACTICE_CONFIG: Record<number, PartPracticeConfig> = {
  1: {
    leftPanel: "audio-image",
    translationVariant: "options",
    showQuestionInRightPanel: false,
    navigationMode: "per-question",
    showOptionTextBeforeAnswer: false,
    hideContextUntilGroupComplete: false,
  },
  2: {
    leftPanel: "audio",
    translationVariant: "question-options",
    showQuestionInRightPanel: false,
    navigationMode: "per-question",
    showOptionTextBeforeAnswer: false,
    hideContextUntilGroupComplete: false,
  },
  3: {
    leftPanel: "listening-group",
    translationVariant: "content-question-options",
    showQuestionInRightPanel: true,
    navigationMode: "per-group",
    showOptionTextBeforeAnswer: true,
    hideContextUntilGroupComplete: true,
  },
  4: {
    leftPanel: "listening-group",
    translationVariant: "content-question-options",
    showQuestionInRightPanel: true,
    navigationMode: "per-group",
    showOptionTextBeforeAnswer: false,
    hideContextUntilGroupComplete: true,
  },
  5: {
    leftPanel: "question",
    translationVariant: "question-options",
    showQuestionInRightPanel: false,
    navigationMode: "per-question",
    showOptionTextBeforeAnswer: false,
    hideContextUntilGroupComplete: false,
  },
  6: {
    leftPanel: "passage",
    translationVariant: "content-options",
    showQuestionInRightPanel: false,
    navigationMode: "per-question",
    showOptionTextBeforeAnswer: false,
    hideContextUntilGroupComplete: false,
  },
  7: {
    leftPanel: "passage",
    translationVariant: "content-question-options",
    showQuestionInRightPanel: true,
    navigationMode: "per-question",
    showOptionTextBeforeAnswer: false,
    hideContextUntilGroupComplete: false,
  },
};

export function getPartPracticeConfig(partNumber: number): PartPracticeConfig {
  return (
    PART_PRACTICE_CONFIG[partNumber] ?? {
      leftPanel: "question",
      translationVariant: "question-options",
      showQuestionInRightPanel: true,
      navigationMode: "per-question",
      showOptionTextBeforeAnswer: false,
      hideContextUntilGroupComplete: false,
    }
  );
}

export function isSupportedPracticePart(partNumber: number) {
  return partNumber >= 1 && partNumber <= 7;
}
