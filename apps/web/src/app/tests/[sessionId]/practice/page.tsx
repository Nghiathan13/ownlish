import { ToeicSessionPage } from "@/features/tests/run/ui/ToeicSessionPage";

type PracticePageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function PracticePage({ params }: PracticePageProps) {
  return <ToeicSessionPage mode="practice" params={params} />;
}
