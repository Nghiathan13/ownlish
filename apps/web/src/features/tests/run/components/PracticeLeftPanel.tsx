import type { ToeicQuestionGroup } from "@/features/tests/shared/api/types";
import { PassagePanel } from "@/features/tests/run/components/PassagePanel";
import { PartInstructionText } from "@/features/tests/run/components/PartInstructionText";
import type { PartPracticeConfig } from "@/features/tests/shared/constants/partPracticeConfig";
import { getPartInstruction } from "@/features/tests/shared/lib/partInstruction";

type PracticeLeftPanelProps = {
  partConfig: PartPracticeConfig;
  partNumber: number;
  group: ToeicQuestionGroup;
  questionText: string | null;
  questionNumber: number;
  audioUrl: string | null;
  imageUrl: string | null;
  mediaError: string | null;
  onMediaError: () => void;
  showContext?: boolean;
  showContextTranslation?: boolean;
  plain?: boolean;
};

export function PracticeLeftPanel({
  partConfig,
  partNumber,
  group,
  questionText,
  questionNumber,
  audioUrl,
  imageUrl,
  mediaError,
  onMediaError,
  showContext = true,
  showContextTranslation = false,
  plain = false,
}: PracticeLeftPanelProps) {
  const instruction = getPartInstruction(partNumber, group);
  const showAudio =
    partConfig.leftPanel !== "none" &&
    (partConfig.leftPanel === "audio-image" ||
      partConfig.leftPanel === "audio" ||
      partConfig.leftPanel === "listening-group");
  const showImage =
    partConfig.leftPanel !== "none" &&
    (partConfig.leftPanel === "audio-image" ||
      partConfig.leftPanel === "listening-group");

  const mediaSection =
    instruction ||
    showAudio ||
    (showImage && (imageUrl || partConfig.leftPanel === "audio-image"));

  const content = (
    <>
      {mediaSection ? (
        <div className="flex shrink-0 flex-col gap-4 bg-background">
          {instruction ? (
            <PartInstructionText
              instruction={instruction}
              partNumber={partNumber}
            />
          ) : null}

          {showAudio ? (
            audioUrl ? (
              <audio
                controls
                className="w-full"
                key={`audio-${group.id}`}
                onError={onMediaError}
                src={audioUrl}
              />
            ) : (
              <p className="text-base text-muted-foreground">No audio available.</p>
            )
          ) : null}

          {showImage ? (
            imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic
              <img
                alt={`Question ${questionNumber}`}
                className="mx-auto max-h-[420px] w-full rounded-lg object-contain"
                key={`image-${group.id}`}
                onError={onMediaError}
                src={imageUrl}
              />
            ) : partConfig.leftPanel === "audio-image" ? (
              <p className="text-base text-muted-foreground">No image available.</p>
            ) : null
          ) : null}
        </div>
      ) : null}

      {partConfig.leftPanel === "listening-group" && showContext ? (
        <PassagePanel
          content={group.content}
          contentVi={group.contentVi}
          showEvidenceToggle
          showTranslation={showContextTranslation}
          title="Transcript"
        />
      ) : null}

      {partConfig.leftPanel === "question" ? (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Question</h3>
          <p className="whitespace-pre-wrap text-base select-text">
            {questionText?.trim() || "No question text available."}
          </p>
        </div>
      ) : null}

      {partConfig.leftPanel === "passage" ? (
        <PassagePanel
          content={group.content}
          contentVi={group.contentVi}
          showTitle={partNumber !== 6 && partNumber !== 7}
          showTranslation={showContextTranslation}
        />
      ) : null}

      {mediaError ? (
        <p className="text-base text-red-600">{mediaError}</p>
      ) : null}
    </>
  );

  if (plain) {
    return content;
  }

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      {content}
    </div>
  );
}
