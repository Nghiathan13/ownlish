import type { ToeicPartNumber } from "@/entities/toeic-runtime";
import {
  PartPracticeCard,
  PartPracticeCardFrame,
  PartPracticeTabs,
} from "@/features/test-overview";
import { TestsScreen } from "./TestsScreen";

type PartPracticePageProps = {
  partNumber: ToeicPartNumber;
};

export function PartPracticePage({ partNumber }: PartPracticePageProps) {
  return (
    <TestsScreen>
      <PartPracticeTabs selectedPartNumber={partNumber} />
      <PartPracticeCardFrame>
        <PartPracticeCard selectedPartNumber={partNumber} />
      </PartPracticeCardFrame>
    </TestsScreen>
  );
}
