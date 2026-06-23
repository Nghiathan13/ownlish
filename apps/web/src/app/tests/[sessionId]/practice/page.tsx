import { ToeicRunPage } from "@/features/tests/run/components/ToeicRunPage";

type PracticePageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function PracticePage({ params }: PracticePageProps) {
  return <ToeicRunPage mode="practice" params={params} />;
}
