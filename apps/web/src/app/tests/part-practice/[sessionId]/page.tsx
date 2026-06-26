import { PartPracticeSessionPage } from "@/features/tests/run/components/PartPracticeSessionPage";

type PartPracticeRunPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function PartPracticeRunPage({ params }: PartPracticeRunPageProps) {
  return <PartPracticeSessionPage params={params} />;
}
