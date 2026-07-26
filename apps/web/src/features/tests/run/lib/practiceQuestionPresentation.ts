import type { PartPracticeConfig } from "@/features/tests/shared/constants/partPracticeConfig";
import {
  isPracticeAnswerGraded,
  type PracticeAnswer,
} from "@/features/tests/run/lib/practiceAnswers";
import type { ToeicQuestion } from "@/entities/toeic-runtime/model/presentation";
import {
  showsOptionTranslation,
  showsQuestionTranslation,
} from "@/features/tests/shared/lib/partTranslationVisibility";

type OptionKey = "A" | "B" | "C" | "D";

export type PracticeQuestionPresentation = {
  selectedKey: OptionKey | null;
  answerKey: OptionKey | null;
  isLocked: boolean;
  showResult: boolean;
  translationVisible: boolean;
  questionEnVisible: boolean;
  showQuestionBilingual: boolean;
  showOptionBilingual: boolean;
};

export function getPracticeQuestionPresentation({
  question,
  answer,
  localSelectedKey,
  usesDeferredGroupGrading,
  showGroupReveal,
  isDeferredGroupPending,
  partConfig,
  isBilingual,
}: {
  question: ToeicQuestion;
  answer?: PracticeAnswer | null;
  localSelectedKey: OptionKey | null;
  usesDeferredGroupGrading: boolean;
  showGroupReveal: boolean;
  isDeferredGroupPending: boolean;
  partConfig: PartPracticeConfig;
  isBilingual: boolean;
}): PracticeQuestionPresentation {
  let selectedKey: OptionKey | null;
  let answerKey: OptionKey | null;
  let isLocked: boolean;
  let showResult: boolean;

  if (usesDeferredGroupGrading) {
    if (isPracticeAnswerGraded(answer) || showGroupReveal) {
      selectedKey = answer?.selectedKey ?? localSelectedKey ?? null;
      answerKey = answer?.answerKey ?? question.answerKey ?? null;
      isLocked = true;
      showResult = true;
    } else {
      selectedKey = localSelectedKey ?? answer?.selectedKey ?? null;
      answerKey = null;
      isLocked = isDeferredGroupPending;
      showResult = false;
    }
  } else {
    selectedKey = answer?.selectedKey ?? null;
    const isGraded = isPracticeAnswerGraded(answer);
    answerKey = isGraded ? (answer?.answerKey ?? question.answerKey ?? null) : null;
    isLocked = isGraded;
    showResult = isGraded;
  }

  const translationVisible = usesDeferredGroupGrading ? showGroupReveal : showResult;
  const showInlineBilingual = isBilingual && translationVisible;
  const questionEnVisible =
    Boolean(question.question?.trim()) &&
    (partConfig.showQuestionInRightPanel || translationVisible);
  const showQuestionBilingual =
    showInlineBilingual &&
    translationVisible &&
    showsQuestionTranslation(partConfig.translationVariant);
  const showOptionBilingual =
    showInlineBilingual && showsOptionTranslation(partConfig.translationVariant);

  return {
    selectedKey,
    answerKey,
    isLocked,
    showResult,
    translationVisible,
    questionEnVisible,
    showQuestionBilingual,
    showOptionBilingual,
  };
}
