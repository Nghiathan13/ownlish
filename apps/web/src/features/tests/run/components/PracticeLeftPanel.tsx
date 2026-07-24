"use client";

import { useRef } from "react";
import type { ToeicQuestionGroup } from "@/features/tests/shared/api/types";
import { PassagePanel } from "@/features/tests/run/components/PassagePanel";
import { PartInstructionText } from "@/features/tests/run/components/PartInstructionText";
import { useAutoplayMediaAudio } from "@/features/tests/run/hooks/useAutoplayMediaAudio";
import type { PartPracticeConfig } from "@/features/tests/shared/constants/partPracticeConfig";
import { getPartInstruction } from "@/features/tests/shared/lib/partInstruction";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

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
  const t = useT();
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

  const audioRef = useRef<HTMLAudioElement>(null);

  useAutoplayMediaAudio({
    audioRef,
    src: audioUrl,
    enabled: showAudio && Boolean(audioUrl),
    onBlocked: onMediaError,
  });

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
                ref={audioRef}
                controls
                className="w-full"
                key={`audio-${group.id}`}
                onError={onMediaError}
                src={audioUrl}
              />
            ) : (
              <p className="text-base text-muted-foreground">
                {t("tests.noAudioAvailable")}
              </p>
            )
          ) : null}

          {showImage ? (
            imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs are dynamic
              <img
                alt={formatMessage(t("tests.questionImageAlt"), {
                  number: questionNumber,
                })}
                className="mx-auto max-h-[420px] w-full object-contain"
                key={`image-${group.id}`}
                onError={onMediaError}
                src={imageUrl}
              />
            ) : partConfig.leftPanel === "audio-image" ? (
              <p className="text-base text-muted-foreground">
                {t("tests.noImageAvailable")}
              </p>
            ) : null
          ) : null}
        </div>
      ) : null}

      {partConfig.leftPanel === "listening-group" && showContext ? (
        <PassagePanel
          content={group.content}
          contentSegments={group.contentSegments}
          contentVi={group.contentVi}
          contentViSegments={group.contentViSegments}
          showEvidenceToggle
          showTranslation={showContextTranslation}
          title={t("tests.transcript")}
        />
      ) : null}

      {partConfig.leftPanel === "question" ? (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">{t("tests.questionHeading")}</h3>
          <p className="whitespace-pre-wrap text-base select-text">
            {questionText?.trim() || t("tests.noQuestionTextAvailable")}
          </p>
        </div>
      ) : null}

      {partConfig.leftPanel === "passage" ? (
        <PassagePanel
          content={group.content}
          contentSegments={group.contentSegments}
          contentVi={group.contentVi}
          contentViSegments={group.contentViSegments}
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
    <div className="space-y-4 rounded-xl border border-border bg-background p-4">
      {content}
    </div>
  );
}
