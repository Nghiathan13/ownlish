import { ToeicRunPage } from "@/features/tests/run/components/ToeicRunPage";

type PracticePageProps = {
  params: Promise<{
    testId: string;
  }>;
};

export default function PracticePage({ params }: PracticePageProps) {
  return <ToeicRunPage mode="practice" params={params} />;
}
