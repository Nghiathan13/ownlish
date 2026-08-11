import { PartPracticeSessionRoutePage } from "@/_pages/tests";

type PartPracticeRunPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function PartPracticeRunPage({ params }: PartPracticeRunPageProps) {
  return <PartPracticeSessionRoutePage params={params} />;
}
