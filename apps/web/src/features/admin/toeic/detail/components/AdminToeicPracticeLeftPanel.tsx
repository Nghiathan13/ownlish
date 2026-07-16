import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { PassagePanel } from "@/features/tests/run/components/PassagePanel";
import { PartInstructionText } from "@/features/tests/run/components/PartInstructionText";
import { getPartPracticeConfig } from "@/features/tests/shared/lib/partPracticeConfig";
import { getPartInstruction } from "@/features/tests/shared/lib/partInstruction";
import { getAdminRawMetadataLines } from "@/features/admin/toeic/detail/lib/adminRawMetadata";

type AdminToeicPracticeLeftPanelProps = {
  group: AdminToeicTestRawGroup;
  partNumber: number;
  questionNumber: number;
};

export function AdminToeicPracticeLeftPanel({
  group,
  partNumber,
  questionNumber,
}: AdminToeicPracticeLeftPanelProps) {
  const partConfig = getPartPracticeConfig(partNumber);
  const instruction = getPartInstruction(partNumber, group);
  const metadataLines = getAdminRawMetadataLines(group, partNumber);
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
    Boolean(instruction) ||
    metadataLines.length > 0 ||
    showAudio ||
    (showImage && (group.imageUrl || partConfig.leftPanel === "audio-image"));

  if (
    partConfig.leftPanel === "none" &&
    metadataLines.length === 0 &&
    !instruction
  ) {
    return null;
  }

  return (
    <>
      {mediaSection ? (
        <div className="flex shrink-0 flex-col gap-4 bg-background">
          {instruction ? (
            <PartInstructionText
              instruction={instruction}
              partNumber={partNumber}
            />
          ) : null}

          {metadataLines.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {metadataLines.map((line) => (
                <p
                  className="text-base font-bold text-foreground select-text"
                  key={line}
                >
                  {line}
                </p>
              ))}
            </div>
          ) : null}

          {showAudio ? (
            group.audioUrl ? (
              <audio
                controls
                className="w-full"
                key={group.audioUrl}
                src={group.audioUrl}
              />
            ) : (
              <p className="text-base text-muted-foreground">No audio available.</p>
            )
          ) : null}

          {showImage ? (
            group.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic
              <img
                alt={`Question ${questionNumber}`}
                className="mx-auto max-h-[420px] w-full object-contain"
                key={group.imageUrl}
                src={group.imageUrl}
              />
            ) : partConfig.leftPanel === "audio-image" ? (
              <p className="text-base text-muted-foreground">No image available.</p>
            ) : null
          ) : null}
        </div>
      ) : null}

      {partConfig.leftPanel === "listening-group" ? (
        <PassagePanel
          content={group.content}
          contentVi={group.contentVi}
          showEvidenceToggle
          showRawContentWhenEvidenceOff
          showTranslation={Boolean(group.contentVi?.trim())}
          title="Transcript"
        />
      ) : null}

      {partConfig.leftPanel === "passage" ? (
        <PassagePanel
          content={group.content}
          contentVi={group.contentVi}
          showTitle={partNumber !== 6 && partNumber !== 7}
          showTranslation={Boolean(group.contentVi?.trim())}
        />
      ) : null}
    </>
  );
}
