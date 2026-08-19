import type { ToeicYear } from "@/entities/toeic-runtime";
import {
  MockTestsCardFrame,
  MockTestsCards,
  MockTestsTab,
} from "@/features/test-overview";
import { TestsScreen } from "./TestsScreen";

type MockTestsPageProps = {
  year: ToeicYear;
};

export function MockTestsPage({ year }: MockTestsPageProps) {
  return (
    <TestsScreen>
      <MockTestsTab selectedYear={year} />
      <MockTestsCardFrame>
        <MockTestsCards selectedYear={year} />
      </MockTestsCardFrame>
    </TestsScreen>
  );
}
