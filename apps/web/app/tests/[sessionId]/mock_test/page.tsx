import { ToeicSessionRoutePage } from "@/_pages/tests";

type MockTestPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function MockTestPage({ params }: MockTestPageProps) {
  return <ToeicSessionRoutePage mode="mock_test" params={params} />;
}
