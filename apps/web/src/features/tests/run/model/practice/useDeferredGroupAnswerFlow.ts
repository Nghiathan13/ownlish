"use client";

import { useCallback, useMemo, useState } from "react";
import type { PracticeSessionController } from "@/features/tests/run/model/practice/practiceSessionController";
import type { PracticeGroup } from "@/features/tests/run/lib/practiceGroups";
import { isPracticeAnswerGraded } from "@/features/tests/run/lib/practiceAnswers";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";

type UseDeferredGroupAnswerFlowParams = {
  practiceGroup: PracticeGroup;
  practice: PracticeSessionController;
  usesDeferredGroupGrading: boolean;
};

export function useDeferredGroupAnswerFlow({
  practiceGroup,
  practice,
  usesDeferredGroupGrading,
}: UseDeferredGroupAnswerFlowParams) {
  const [localSelections, setLocalSelections] = useState<
    Record<number, OptionKey>
  >({});

  const selectableQuestionIds = useMemo(() => {
    return practiceGroup.questions
      .filter(
        (question) => !isPracticeAnswerGraded(practice.getAnswer(question.id)),
      )
      .map((question) => question.id);
  }, [practice, practiceGroup.questions]);

  const isGroupGraded = practiceGroup.questions.every((question) =>
    isPracticeAnswerGraded(practice.getAnswer(question.id)),
  );

  const allSelectableSelected = selectableQuestionIds.every((questionId) => {
    const selectedKey =
      localSelections[questionId] ?? practice.getAnswer(questionId)?.selectedKey;
    return selectedKey != null;
  });

  const showGroupReveal =
    !usesDeferredGroupGrading || isGroupGraded;
  const isPartialGroupPhase = usesDeferredGroupGrading && !showGroupReveal;
  const isGroupPending =
    usesDeferredGroupGrading &&
    allSelectableSelected &&
    selectableQuestionIds.some(practice.isQuestionPending);

  const handleSelect = useCallback(
    (toeicQuestionId: number, key: OptionKey) => {
      if (!selectableQuestionIds.includes(toeicQuestionId)) {
        return;
      }

      if (showGroupReveal && usesDeferredGroupGrading) {
        return;
      }

      const existing = practice.getAnswer(toeicQuestionId);
      const currentSelectedKey =
        localSelections[toeicQuestionId] ?? existing?.selectedKey;
      if (currentSelectedKey === key) {
        return;
      }

      if (!usesDeferredGroupGrading) {
        practice.selectAnswer(toeicQuestionId, key, {
          replace: Boolean(existing?.selectedKey),
        });
        return;
      }

      setLocalSelections((current) => ({
        ...current,
        [toeicQuestionId]: key,
      }));
      practice.selectAnswer(toeicQuestionId, key, {
        deferGrade: true,
        replace: Boolean(existing?.selectedKey),
      });
    },
    [
      localSelections,
      practice,
      selectableQuestionIds,
      showGroupReveal,
      usesDeferredGroupGrading,
    ],
  );

  const getLocalSelectedKey = useCallback(
    (questionId: number) => localSelections[questionId] ?? null,
    [localSelections],
  );

  return {
    showGroupReveal,
    isPartialGroupPhase,
    isGroupPending,
    handleSelect,
    getLocalSelectedKey,
  };
}
