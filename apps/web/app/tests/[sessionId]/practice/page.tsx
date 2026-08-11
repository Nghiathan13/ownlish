import { ToeicSessionRoutePage } from "@/_pages/tests";

type PracticePageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function PracticePage({ params }: PracticePageProps) {
  return <ToeicSessionRoutePage mode="practice" params={params} />;
}
