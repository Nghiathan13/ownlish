import { ToeicSessionPage } from "@/features/tests/run/ui/ToeicSessionPage";

type MockTestPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function MockTestPage({ params }: MockTestPageProps) {
  return <ToeicSessionPage mode="mock_test" params={params} />;
}
