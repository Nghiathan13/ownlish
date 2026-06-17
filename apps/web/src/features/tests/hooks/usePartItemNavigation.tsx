"use client";

import { useMemo, useState } from "react";
import { PracticeNavigationButtons } from "@/features/tests/components/PracticeNavigationButtons";
import type { usePracticeSession } from "@/features/tests/hooks/usePracticeSession";
import { getQuestionGridResultFromAnswer } from "@/features/tests/lib/practiceAnswers";
import type { PracticeItem } from "@/features/tests/lib/practiceGroups";
import {
  buildItemGridSection,
  findItemIndexForQuestion,
} from "@/features/tests/lib/practiceQuestionGrid";
import { writePracticeIndex } from "@/features/tests/lib/practiceStorage";

type UsePartItemNavigationParams = {
  testId: number;
  partNumber: number;
  items: PracticeItem[];
  initialIndex: number;
  practice: ReturnType<typeof usePracticeSession>;
};

export function usePartItemNavigation({
  testId,
  partNumber,
  items,
  initialIndex,
  practice,
}: UsePartItemNavigationParams) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const activeIndex =
    items.length === 0 ? 0 : Math.min(currentIndex, items.length - 1);
  const currentItem = items[activeIndex] ?? null;

  const goToIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, items.length - 1));
    setCurrentIndex(nextIndex);
    writePracticeIndex(testId, partNumber, nextIndex);
  };

  const handleNext = () => {
    if (activeIndex >= items.length - 1) {
      return;
    }

    goToIndex(activeIndex + 1);
  };

  const isLastItem = activeIndex >= items.length - 1;

  const activeQuestionNumbers = useMemo(() => {
    const numbers = new Set<number>();
    if (currentItem) {
      numbers.add(currentItem.question.questionNumber);
    }
    return numbers;
  }, [currentItem]);

  const questionGridSections = useMemo(
    () => [
      buildItemGridSection(
        partNumber,
        items,
        activeQuestionNumbers,
        (questionId) => getQuestionGridResultFromAnswer(practice.getAnswer(questionId)),
      ),
    ],
    [activeQuestionNumbers, items, partNumber, practice],
  );

  const navigationBar = (
    <PracticeNavigationButtons
      nextDisabled={isLastItem}
      onNext={handleNext}
      onPrevious={() => goToIndex(activeIndex - 1)}
      onQuestionGridSelect={(questionNumber) => {
        const index = findItemIndexForQuestion(items, questionNumber);
        if (index >= 0) {
          goToIndex(index);
        }
      }}
      previousDisabled={activeIndex === 0}
      questionGridSections={questionGridSections}
    />
  );

  return {
    currentItem,
    navigationBar,
  };
}
