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

export type PartContentLayout = "default" | "split-plain";

export type PartPracticeConfig = {
  leftPanel: PartLeftPanel;
  translationVariant: PartTranslationVariant;
  showQuestionInRightPanel: boolean;
  navigationMode: "per-question" | "per-group";
  showOptionTextBeforeAnswer: boolean;
  hideContextUntilGroupComplete: boolean;
  contentLayout: PartContentLayout;
};

export const PART_PRACTICE_CONFIG: Record<number, PartPracticeConfig> = {
  1: {
    leftPanel: "audio-image",
    translationVariant: "options",
    showQuestionInRightPanel: false,
    navigationMode: "per-question",
    showOptionTextBeforeAnswer: false,
    hideContextUntilGroupComplete: false,
    contentLayout: "split-plain",
  },
  2: {
    leftPanel: "audio",
    translationVariant: "question-options",
    showQuestionInRightPanel: false,
    navigationMode: "per-question",
    showOptionTextBeforeAnswer: false,
    hideContextUntilGroupComplete: false,
    contentLayout: "default",
  },
  3: {
    leftPanel: "listening-group",
    translationVariant: "content-question-options",
    showQuestionInRightPanel: true,
    navigationMode: "per-group",
    showOptionTextBeforeAnswer: true,
    hideContextUntilGroupComplete: true,
    contentLayout: "default",
  },
  4: {
    leftPanel: "listening-group",
    translationVariant: "content-question-options",
    showQuestionInRightPanel: true,
    navigationMode: "per-group",
    showOptionTextBeforeAnswer: true,
    hideContextUntilGroupComplete: true,
    contentLayout: "default",
  },
  5: {
    leftPanel: "question",
    translationVariant: "question-options",
    showQuestionInRightPanel: false,
    navigationMode: "per-question",
    showOptionTextBeforeAnswer: true,
    hideContextUntilGroupComplete: false,
    contentLayout: "default",
  },
  6: {
    leftPanel: "passage",
    translationVariant: "options",
    showQuestionInRightPanel: false,
    navigationMode: "per-group",
    showOptionTextBeforeAnswer: true,
    hideContextUntilGroupComplete: true,
    contentLayout: "default",
  },
  7: {
    leftPanel: "passage",
    translationVariant: "question-options",
    showQuestionInRightPanel: true,
    navigationMode: "per-group",
    showOptionTextBeforeAnswer: true,
    hideContextUntilGroupComplete: true,
    contentLayout: "default",
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
      contentLayout: "default",
    }
  );
}

export function isSupportedPracticePart(partNumber: number) {
  return partNumber >= 1 && partNumber <= 7;
}
