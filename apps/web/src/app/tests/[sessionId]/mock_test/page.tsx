import { MockTestRunPage } from "@/features/tests/run/components/MockTestRunPage";

type MockTestPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function MockTestPage({ params }: MockTestPageProps) {
  return <MockTestRunPage params={params} />;
}
