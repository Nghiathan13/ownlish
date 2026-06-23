import { ToeicSessionPage } from "@/features/tests/run/components/ToeicSessionPage";

type PracticePageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function PracticePage({ params }: PracticePageProps) {
  return <ToeicSessionPage mode="practice" params={params} />;
}
