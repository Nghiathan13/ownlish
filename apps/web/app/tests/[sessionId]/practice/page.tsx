import { PracticeSessionRoutePage } from "@/_pages/tests";

type PracticePageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function PracticePage({ params }: PracticePageProps) {
  return <PracticeSessionRoutePage mode="practice" params={params} />;
}
