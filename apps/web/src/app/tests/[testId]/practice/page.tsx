import { ToeicRunPage } from "@/features/tests/components/ToeicRunPage";

type PracticePageProps = {
  params: Promise<{
    testId: string;
  }>;
};

export default function PracticePage({ params }: PracticePageProps) {
  return <ToeicRunPage mode="practice" params={params} />;
}
