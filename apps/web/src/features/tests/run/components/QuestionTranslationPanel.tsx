import type { ToeicQuestionOptions } from "@/features/tests/shared/api/types";
import { PracticeTranslationCard } from "@/features/tests/run/components/PracticeTranslationCard";
import type { PartTranslationVariant } from "@/features/tests/shared/constants/partPracticeConfig";
import {
  showsOptionTranslation,
  showsQuestionTranslation,
} from "@/features/tests/shared/lib/partTranslationVisibility";
import { classNames } from "@/shared/lib/classNames";
import { RightIcon } from "@/shared/ui/icons/RightIcon";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type QuestionTranslationPanelProps = {
  options: ToeicQuestionOptions;
  optionCount: number;
  visible: boolean;
  variant?: PartTranslationVariant;
  questionVi?: string | null;
  answerKey?: "A" | "B" | "C" | "D" | null;
};

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export function QuestionTranslationPanel({
  options,
  optionCount,
  visible,
  variant = "options",
  questionVi,
  answerKey = null,
}: QuestionTranslationPanelProps) {
  if (!visible) {
    return null;
  }

  const showQuestion = showsQuestionTranslation(variant);
  const showOptions = showsOptionTranslation(variant);

  return (
    <PracticeTranslationCard>
      {showQuestion && questionVi?.trim() ? (
        <p className="font-semibold whitespace-pre-wrap">{questionVi}</p>
      ) : null}
      {showOptions
        ? OPTION_KEYS.slice(0, optionCount).map((key) => {
            const viKey = `${key}_vi` as keyof ToeicQuestionOptions;
            const label = options[viKey];
            if (!label) {
              return null;
            }

            const isCorrect = answerKey === key;

            return (
              <p
                className={classNames(
                  "flex items-center gap-2",
                  isCorrect && statusColorClasses.success.text,
                )}
                key={key}
              >
                {isCorrect ? (
                  <RightIcon
                    className={classNames(
                      "size-4",
                      statusColorClasses.success.text,
                      "-translate-y-[0.5px]",
                    )}
                  />
                ) : null}
                {key}. {label}
              </p>
            );
          })
        : null}
    </PracticeTranslationCard>
  );
}
