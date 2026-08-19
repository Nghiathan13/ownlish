import { MockSessionRoutePage } from "@/_pages/tests";

type MockTestPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function MockTestPage({ params }: MockTestPageProps) {
  return <MockSessionRoutePage params={params} />;
}
