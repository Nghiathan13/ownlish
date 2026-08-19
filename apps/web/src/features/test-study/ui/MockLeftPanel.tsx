"use client";

import type { ToeicQuestionGroup } from "@/entities/toeic-runtime";
import { PassagePanel } from "@/features/test-study/ui/PassagePanel";
import { PartInstructionText } from "@/features/test-study/ui/PartInstructionText";
import type { PartPracticeConfig } from "@/entities/toeic-runtime";
import { getPartInstruction } from "@/entities/toeic-runtime";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";

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
        // eslint-disable-next-line @next/next/no-img-element -- external catalog URLs are dynamic
        <img
          alt={formatMessage(t("tests.questionImageAlt"), {
            number: group.questionStart,
          })}
          className="mx-auto block h-auto max-h-[420px] w-auto max-w-full"
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

      {mediaError ? <p className="text-base text-danger">{mediaError}</p> : null}
    </div>
  );
}
