import { ToeicSessionPage } from "./ToeicSessionPage";

type MockTestRunPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export function MockTestRunPage({ params }: MockTestRunPageProps) {
  return <ToeicSessionPage mode="mock_test" params={params} />;
}
