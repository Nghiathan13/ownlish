import type { ToeicQuestionOptions } from "@/features/tests/api/types";
import { classNames } from "@/shared/lib/classNames";
import { CircleIcon } from "@/shared/ui/icons/CircleIcon";
import { RightIcon } from "@/shared/ui/icons/RightIcon";
import { WrongIcon } from "@/shared/ui/icons/WrongIcon";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

type QuestionOptionsProps = {
  optionCount: number;
  options: ToeicQuestionOptions;
  selectedKey: "A" | "B" | "C" | "D" | null;
  answerKey: "A" | "B" | "C" | "D" | null;
  isSubmitting?: boolean;
  isLocked?: boolean;
  showEnglishTextBeforeAnswer?: boolean;
  showResult?: boolean;
  onSelect: (key: "A" | "B" | "C" | "D") => void;
};

function getOptionEnglishText(
  key: (typeof OPTION_KEYS)[number],
  options: ToeicQuestionOptions,
) {
  const text = options[key]?.trim();
  if (!text) {
    return null;
  }

  if (text.toUpperCase() === key) {
    return null;
  }

  return text;
}

type OptionLabelProps = {
  optionKey: (typeof OPTION_KEYS)[number];
  englishText: string | null;
  showEnglishText: boolean;
};

function OptionLabel({ optionKey, englishText, showEnglishText }: OptionLabelProps) {
  return (
    <span className="text-base font-normal leading-snug tracking-normal">
      {optionKey}
      {englishText ? (
        <span className={showEnglishText ? "" : "invisible"}>. {englishText}</span>
      ) : null}
    </span>
  );
}

type OptionAnswerIconProps = {
  isCorrect: boolean;
  isSelected: boolean;
  isWrong: boolean;
  showGrading: boolean;
};

function OptionAnswerIcon({
  isCorrect,
  isSelected,
  isWrong,
  showGrading,
}: OptionAnswerIconProps) {
  const iconOffsetClass = "-translate-y-[0.5px]";

  if (isCorrect) {
    return (
      <RightIcon className={classNames(statusColorClasses.success.text, iconOffsetClass)} />
    );
  }

  if (isWrong) {
    return (
      <WrongIcon className={classNames(statusColorClasses.danger.text, iconOffsetClass)} />
    );
  }

  return (
    <CircleIcon
      className={classNames("text-foreground", iconOffsetClass)}
      selected={isSelected && !showGrading}
    />
  );
}

export function QuestionOptions({
  optionCount,
  options,
  selectedKey,
  answerKey,
  isSubmitting = false,
  isLocked = false,
  showEnglishTextBeforeAnswer = false,
  showResult = true,
  onSelect,
}: QuestionOptionsProps) {
  const locked = isLocked;
  const showGrading = showResult && locked;

  return (
    <div className="grid gap-2">
      {OPTION_KEYS.slice(0, optionCount).map((key) => {
        const isSelected = selectedKey === key;
        const isCorrect = showGrading && answerKey === key;
        const isWrong = showGrading && isSelected && answerKey !== null && !isCorrect;
        const isSelectedHighlight = !locked && isSelected;
        const englishText = getOptionEnglishText(key, options);
        const showEnglishText =
          Boolean(englishText) &&
          (showEnglishTextBeforeAnswer || locked);

        const className = classNames(
          "flex min-h-10 items-center gap-2 rounded-lg border px-4 py-2 text-left font-inherit select-text",
          locked && "cursor-text",
          isCorrect && statusColorClasses.success.surface,
          isWrong && statusColorClasses.danger.surface,
          isSelectedHighlight && "border-foreground bg-muted",
          locked &&
            !isCorrect &&
            !isWrong &&
            "border-border bg-background",
          !locked &&
            !isSelectedHighlight &&
            "border-border bg-background hover:border-foreground",
          !locked && isSubmitting && "pointer-events-none opacity-70",
        );

        const content = (
          <>
            <OptionAnswerIcon
              isCorrect={isCorrect}
              isSelected={isSelected}
              isWrong={isWrong}
              showGrading={showGrading}
            />
            <OptionLabel
              englishText={englishText}
              optionKey={key}
              showEnglishText={showEnglishText}
            />
          </>
        );

        if (locked) {
          return (
            <div className={className} key={key}>
              {content}
            </div>
          );
        }

        return (
          <button
            className={className}
            disabled={isSubmitting}
            key={key}
            onClick={() => onSelect(key)}
            type="button"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
