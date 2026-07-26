"use client";

import type { ToeicQuestionGroup } from "@/features/tests/shared/api/types";
import { PassagePanel } from "@/features/tests/run/components/PassagePanel";
import { PartInstructionText } from "@/features/tests/run/components/PartInstructionText";
import type { PartPracticeConfig } from "@/features/tests/shared/constants/partPracticeConfig";
import { getPartInstruction } from "@/features/tests/shared/lib/partInstruction";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

type MockLeftPanelProps = {
  group: ToeicQuestionGroup;
  imageUrl: string | null;
  mediaError: string | null;
  partConfig: PartPracticeConfig;
  partNumber: number;
};

export function MockLeftPanel({
  group,
  imageUrl,
  mediaError,
  partConfig,
  partNumber,
}: MockLeftPanelProps) {
  const t = useT();
  const instruction = getPartInstruction(partNumber, group);
  const showImage =
    partConfig.leftPanel === "audio-image" ||
    partConfig.leftPanel === "listening-group";
  const showReadingPassage = partNumber >= 5 && partConfig.leftPanel === "passage";

  return (
    <div className="space-y-4">
      {instruction ? (
        <PartInstructionText
          instruction={instruction}
          partNumber={partNumber}
        />
      ) : null}

      {showImage && imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic
        <img
          alt={formatMessage(t("tests.questionImageAlt"), {
            number: group.questionStart,
          })}
          className="mx-auto block h-auto max-h-[420px] w-auto max-w-full rounded-xl shadow-card dark:border dark:border-border"
          key={`image-${group.id}`}
          src={imageUrl}
        />
      ) : null}

      {showReadingPassage ? (
        <PassagePanel
          content={group.content}
          showTitle={partNumber !== 6 && partNumber !== 7}
          showTranslation={false}
        />
      ) : null}

      {mediaError ? <p className="text-base text-red-600">{mediaError}</p> : null}
    </div>
  );
}
