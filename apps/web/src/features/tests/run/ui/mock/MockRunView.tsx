"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MockGroupScreen } from "@/features/tests/run/ui/mock/MockGroupScreen";
import { MockFinishFailureModal } from "@/features/tests/run/ui/mock/MockFinishFailureModal";
import { MockSubmissionAlert } from "@/features/tests/run/ui/mock/MockSubmissionAlert";
import { TestRunLoadingSkeleton } from "@/features/tests/run/components/TestRunLoadingSkeleton";
import { PracticeNavigationButtons } from "@/features/tests/run/components/PracticeNavigationButtons";
import { useMockTestRun } from "@/features/tests/run/model/mock/useMockTestRun";
import { useRegisterImmersiveQuestionNav } from "@/features/shell/hooks/useRegisterImmersiveQuestionNav";
import {
  useRegisterImmersiveExit,
  useRegisterImmersiveFinish,
} from "@/features/shell/providers/ImmersiveToolbarProvider";
import type { ToeicQuestionGroup } from "@/features/tests/shared/api/types";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPathFromYearValue,
} from "@/features/tests/shared/constants/toeicYears";
import type { QuestionGridSection } from "@/features/tests/run/lib/practiceQuestionGrid";
import { getToeicQuestionGridDisplayNumber } from "@/features/tests/run/lib/practiceQuestionGrid";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";
import {
  getSessionQuestionNumber,
} from "@/features/tests/run/lib/sessionQuestionPosition";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/Modal";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type MockRunViewProps = {
  sessionId: string;
  selectedParts: number[];
};

type HiddenMockAudioProps = {
  audioUrl: string | null;
  enabled: boolean;
  groupId: number;
  onAutoplayBlocked: () => void;
  onEnded: () => void;
  onError: () => void;
};

function getAudioStorageKey(sessionId: string) {
  return `mock-audio-played-${sessionId}`;
}

function readPlayedAudioGroups(sessionId: string): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(getAudioStorageKey(sessionId));
  if (!raw) {
    return [];
  }

  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value)
      ? value.filter((item): item is number => typeof item === "number")
      : [];
  } catch {
    return [];
  }
}

function writePlayedAudioGroups(sessionId: string, groupIds: number[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getAudioStorageKey(sessionId), JSON.stringify(groupIds));
}

function isListeningGroup(group: ToeicQuestionGroup) {
  return group.partNumber != null && group.partNumber <= 4;
}

function isReadingGroup(group: ToeicQuestionGroup) {
  return group.partNumber != null && group.partNumber >= 5;
}

function findGroupIndexForQuestionId(
  groups: ToeicQuestionGroup[],
  questionId: number,
) {
  return groups.findIndex((group) =>
    group.questions.some((question) => question.id === questionId),
  );
}

function buildMockGridSections(
  groups: ToeicQuestionGroup[],
  activeGroup: ToeicQuestionGroup | null,
  isReviewingResults: boolean,
): QuestionGridSection[] {
  const sections = new Map<number, QuestionGridSection>();
  const activeQuestionIds = new Set(
    activeGroup?.questions.map((question) => question.id) ?? [],
  );

  for (const group of groups) {
    if (group.partNumber == null) {
      continue;
    }

    const section = sections.get(group.partNumber) ?? {
      partNumber: group.partNumber,
      cells: [],
    };

    for (const question of group.questions) {
      section.cells.push({
        questionId: question.id,
        displayNumber: getToeicQuestionGridDisplayNumber(question),
        isActive: activeQuestionIds.has(question.id),
        isSelected:
          !isReviewingResults &&
          question.selectedKey != null &&
          question.isCorrect == null,
        result: isReviewingResults
          ? question.isCorrect === true
            ? "correct"
            : question.isCorrect === false
              ? "wrong"
              : null
          : null,
      });
    }

    sections.set(group.partNumber, section);
  }

  return Array.from(sections.values()).sort(
    (left, right) => left.partNumber - right.partNumber,
  );
}

function HiddenMockAudio({
  audioUrl,
  enabled,
  groupId,
  onAutoplayBlocked,
  onEnded,
  onError,
}: HiddenMockAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callbacksRef = useRef({ onAutoplayBlocked, onEnded, onError });
  const playedAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    callbacksRef.current = { onAutoplayBlocked, onEnded, onError };
  }, [onAutoplayBlocked, onEnded, onError]);

  useEffect(() => {
    if (!enabled || !audioUrl || !audioRef.current) {
      return;
    }

    if (playedAudioUrlRef.current === audioUrl) {
      return;
    }

    playedAudioUrlRef.current = audioUrl;
    audioRef.current.currentTime = 0;
    const playPromise = audioRef.current.play();
    if (playPromise) {
      void playPromise.catch(() => callbacksRef.current.onAutoplayBlocked());
    }
  }, [audioUrl, enabled]);

  if (!enabled || !audioUrl) {
    return null;
  }

  return (
    <audio
      hidden
      key={`mock-audio-${groupId}`}
      onEnded={() => callbacksRef.current.onEnded()}
      onError={() => callbacksRef.current.onError()}
      preload="auto"
      ref={audioRef}
      src={audioUrl}
    />
  );
}

function MockResultModal({
  answeredCount,
  correctCount,
  onClose,
  wrongCount,
}: {
  answeredCount: number;
  correctCount: number;
  onClose: () => void;
  wrongCount: number;
}) {
  return (
    <Modal onClose={onClose} title="Mock test result">
      <div className="grid gap-3 text-base">
        <p>Answered: {answeredCount}</p>
        <p>Correct: {correctCount}</p>
        <p>Wrong: {wrongCount}</p>
      </div>
    </Modal>
  );
}

export function MockRunView({ sessionId, selectedParts }: MockRunViewProps) {
  const router = useRouter();
  const mock = useMockTestRun({ selectedParts, sessionId });
  const isReviewingResults = mock.isFinished || mock.isFinishAccepted;
  const testsListPath = getTestsListPathFromYearValue(
    mock.year ?? DEFAULT_TOEIC_YEAR,
  );
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [isReadingPhaseForced, setIsReadingPhaseForced] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [playedAudioGroupIds, setPlayedAudioGroupIds] = useState<number[]>(() =>
    readPlayedAudioGroups(sessionId),
  );
  const groups = mock.groups;
  const listeningGroups = useMemo(() => groups.filter(isListeningGroup), [groups]);
  const hasListening = listeningGroups.length > 0;
  const defaultActiveGroupIndex = useMemo(() => {
    const firstUnplayedListeningIndex = groups.findIndex(
      (group) => isListeningGroup(group) && !playedAudioGroupIds.includes(group.id),
    );

    if (firstUnplayedListeningIndex >= 0) {
      return firstUnplayedListeningIndex;
    }

    const firstReadingIndex = groups.findIndex(isReadingGroup);
    return firstReadingIndex >= 0 ? firstReadingIndex : 0;
  }, [groups, playedAudioGroupIds]);
  const activeGroupIndex = selectedGroupIndex ?? defaultActiveGroupIndex;
  const activeGroup = groups[activeGroupIndex] ?? null;
  const hasUnplayedListening = listeningGroups.some(
    (group) => !playedAudioGroupIds.includes(group.id),
  );
  const isReadingPhase =
    isReadingPhaseForced ||
    isReviewingResults ||
    (!hasUnplayedListening && hasListening);
  const canNavigate = isReviewingResults || isReadingPhase || !hasListening;
  const shouldPlayListeningAudio =
    !isReviewingResults &&
    !isReadingPhase &&
    activeGroup != null &&
    isListeningGroup(activeGroup) &&
    !playedAudioGroupIds.includes(activeGroup.id) &&
    mediaError == null;
  const mediaMessage =
    shouldPlayListeningAudio && !activeGroup.audioUrl
      ? "Audio is not available for this question group."
      : mediaError;
  const finishRun = mock.finishRun;
  const selectAnswer = mock.selectAnswer;

  const markAudioPlayed = useCallback(
    (groupId: number) => {
      setPlayedAudioGroupIds((current) => {
        if (current.includes(groupId)) {
          return current;
        }

        const next = [...current, groupId];
        writePlayedAudioGroups(sessionId, next);
        return next;
      });
    },
    [sessionId],
  );

  const goToGroupIndex = useCallback(
    (nextIndex: number) => {
      setMediaError(null);
      setSelectedGroupIndex(Math.max(0, Math.min(nextIndex, groups.length - 1)));
    },
    [groups.length],
  );

  const advanceAfterAudio = useCallback(() => {
    if (!activeGroup) {
      return;
    }

    markAudioPlayed(activeGroup.id);
    const nextListeningIndex = groups.findIndex(
      (group, index) =>
        index > activeGroupIndex &&
        isListeningGroup(group) &&
        !playedAudioGroupIds.includes(group.id),
    );

    if (nextListeningIndex >= 0) {
      goToGroupIndex(nextListeningIndex);
      return;
    }

    setIsReadingPhaseForced(true);
    const firstReadingIndex = groups.findIndex(isReadingGroup);
    goToGroupIndex(firstReadingIndex >= 0 ? firstReadingIndex : activeGroupIndex);
  }, [activeGroup, activeGroupIndex, goToGroupIndex, groups, markAudioPlayed, playedAudioGroupIds]);

  const handleSelect = useCallback(
    (toeicQuestionId: number, selectedKey: OptionKey) => {
      selectAnswer(toeicQuestionId, selectedKey);
    },
    [selectAnswer],
  );

  const handleFinish = useCallback(async () => {
    await finishRun();
  }, [finishRun]);

  const testLabel = mock.testId ? `Test ${mock.testId}` : null;

  useRegisterImmersiveFinish(
    isReviewingResults ? null : handleFinish,
    isReviewingResults ? null : testLabel,
    {
      disabled:
        mock.isFinishing || mock.hasPendingAnswers || mock.hasSyncFailures,
      isPending: mock.isFinishing,
    },
  );

  useRegisterImmersiveExit(
    isReviewingResults ? () => undefined : null,
    isReviewingResults ? testLabel : null,
    testsListPath,
    { showBilingualAction: true },
  );

  const questionGridSections = useMemo(
    () => buildMockGridSections(groups, activeGroup, isReviewingResults),
    [activeGroup, groups, isReviewingResults],
  );
  const totalQuestions = mock.totalQuestions;
  const currentQuestionNumber = getSessionQuestionNumber(
    groups,
    activeGroup?.questions[0]?.id,
  );

  useRegisterImmersiveQuestionNav({
    currentQuestionNumber,
    enabled: groups.length > 0,
    totalQuestions,
  });

  const finishFailureModal = mock.isFinishFailureOpen ? (
    <MockFinishFailureModal
      error={mock.finishError ?? "Cannot finish mock test."}
      isRetrying={mock.isFinishing}
      onClose={mock.closeFinishFailure}
      onRetry={() => void mock.finishRun()}
    />
  ) : null;

  if (mock.isLoading) {
    return (
      <>
        <TestRunLoadingSkeleton variant="mock_test" />
        {finishFailureModal}
      </>
    );
  }

  if (mock.loadError) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">{mock.loadError}</p>
          <div className="mt-4">
            <button
              className={secondaryTextButtonClassName()}
              onClick={() => router.push(testsListPath)}
              type="button"
            >
              Back to tests
            </button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (!activeGroup) {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">This mock test has no questions.</p>
        </Panel>
      </PageShell>
    );
  }

  const navigation = canNavigate ? (
    <div className="shrink-0 border-t border-border p-4">
      <PracticeNavigationButtons
        nextDisabled={activeGroupIndex >= groups.length - 1}
        onNext={() => goToGroupIndex(activeGroupIndex + 1)}
        onPrevious={() => goToGroupIndex(activeGroupIndex - 1)}
        onQuestionGridSelect={(questionId) => {
          const nextGroupIndex = findGroupIndexForQuestionId(groups, questionId);
          if (nextGroupIndex >= 0) {
            goToGroupIndex(nextGroupIndex);
          }
        }}
        previousDisabled={activeGroupIndex === 0}
        questionGridSections={questionGridSections}
      />
    </div>
  ) : null;

  return (
    <PageShell fillViewport>
      <HiddenMockAudio
        audioUrl={activeGroup.audioUrl}
        enabled={shouldPlayListeningAudio && Boolean(activeGroup.audioUrl)}
        groupId={activeGroup.id}
        onAutoplayBlocked={() => setMediaError("Audio autoplay was blocked.")}
        onEnded={advanceAfterAudio}
        onError={() => setMediaError("Audio could not be loaded.")}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <MockSubmissionAlert
          hasSyncFailures={mock.hasSyncFailures}
          onRetry={mock.retryFailedAnswers}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MockGroupScreen
            group={activeGroup}
            isFinished={mock.isFinished}
            isReviewingResults={isReviewingResults}
            mediaError={mediaMessage}
            onSelect={handleSelect}
            partNumber={activeGroup.partNumber ?? 1}
          />
        </div>
        {navigation}
      </div>
      {mock.isResultOpen ? (
        <MockResultModal
          answeredCount={mock.correctCount + mock.wrongCount}
          correctCount={mock.correctCount}
          onClose={mock.closeResult}
          wrongCount={mock.wrongCount}
        />
      ) : null}
      {finishFailureModal}
    </PageShell>
  );
}
