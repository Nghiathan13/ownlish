import { ToeicSessionPage } from "@/features/tests/run/ui/ToeicSessionPage";

type MockTestRunPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export function MockTestRunPage({ params }: MockTestRunPageProps) {
  return <ToeicSessionPage mode="mock_test" params={params} />;
}
