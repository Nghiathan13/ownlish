import type { ToeicQuestionGroup } from "@/features/tests/shared/api/types";
import { PassagePanel } from "@/features/tests/run/components/PassagePanel";
import type { PartPracticeConfig } from "@/features/tests/shared/constants/partPracticeConfig";
import { getPartInstruction } from "@/features/tests/shared/lib/partInstruction";

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
  const instruction = getPartInstruction(partNumber, group);
  const showImage =
    partConfig.leftPanel === "audio-image" ||
    partConfig.leftPanel === "listening-group";
  const showReadingPassage = partNumber >= 5 && partConfig.leftPanel === "passage";

  return (
    <div className="space-y-4">
      {instruction ? (
        <p className="text-base font-bold text-foreground select-text">
          {instruction}
        </p>
      ) : null}

      {showImage && imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic
        <img
          alt={`Question ${group.questionStart}`}
          className="mx-auto max-h-[420px] w-full rounded-lg object-contain"
          key={imageUrl}
          src={imageUrl}
        />
      ) : null}

      {showReadingPassage ? (
        <PassagePanel
          content={group.content}
          showTitle={partNumber !== 6}
          showTranslation={false}
        />
      ) : null}

      {mediaError ? <p className="text-base text-red-600">{mediaError}</p> : null}
    </div>
  );
}
