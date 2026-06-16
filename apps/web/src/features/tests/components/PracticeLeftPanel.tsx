import type { ToeicQuestionGroup } from "@/features/tests/api/types";
import type { PartPracticeConfig } from "@/features/tests/lib/partPracticeConfig";
import { PassagePanel } from "@/features/tests/components/PassagePanel";

type PracticeLeftPanelProps = {
  partConfig: PartPracticeConfig;
  group: ToeicQuestionGroup;
  questionText: string | null;
  questionNumber: number;
  audioUrl: string | null;
  imageUrl: string | null;
  mediaError: string | null;
  onMediaError: () => void;
  showTranslation: boolean;
};

export function PracticeLeftPanel({
  partConfig,
  group,
  questionText,
  questionNumber,
  audioUrl,
  imageUrl,
  mediaError,
  onMediaError,
  showTranslation,
}: PracticeLeftPanelProps) {
  const showAudio =
    partConfig.leftPanel === "audio-image" ||
    partConfig.leftPanel === "audio" ||
    partConfig.leftPanel === "listening-group";
  const showImage =
    partConfig.leftPanel === "audio-image" ||
    partConfig.leftPanel === "listening-group";

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      {showAudio ? (
        audioUrl ? (
          <audio
            controls
            className="w-full"
            key={audioUrl}
            onError={onMediaError}
            src={audioUrl}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No audio available.</p>
        )
      ) : null}

      {showImage ? (
        imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic
          <img
            alt={`Question ${questionNumber}`}
            className="mx-auto max-h-[420px] w-full rounded-lg object-contain"
            key={imageUrl}
            onError={onMediaError}
            src={imageUrl}
          />
        ) : partConfig.leftPanel === "audio-image" ? (
          <p className="text-sm text-muted-foreground">No image available.</p>
        ) : null
      ) : null}

      {partConfig.leftPanel === "listening-group" ? (
        <PassagePanel
          content={group.content}
          contentVi={group.contentVi}
          showTranslation={showTranslation}
          title="Context"
        />
      ) : null}

      {partConfig.leftPanel === "question" ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Question</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed select-text">
            {questionText?.trim() || "No question text available."}
          </p>
        </div>
      ) : null}

      {partConfig.leftPanel === "passage" ? (
        <PassagePanel
          content={group.content}
          contentVi={group.contentVi}
          showTranslation={showTranslation}
        />
      ) : null}

      {mediaError ? (
        <p className="text-sm text-red-600">{mediaError}</p>
      ) : null}
    </div>
  );
}
