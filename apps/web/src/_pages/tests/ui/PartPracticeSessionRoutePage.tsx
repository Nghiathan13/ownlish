import { PartPracticeSessionPage } from "@/features/tests/run/components/PartPracticeSessionPage";

type PartPracticeSessionRoutePageProps = {
  params: Promise<{ sessionId: string }>;
};

export function PartPracticeSessionRoutePage({
  params,
}: PartPracticeSessionRoutePageProps) {
  return <PartPracticeSessionPage params={params} />;
}
