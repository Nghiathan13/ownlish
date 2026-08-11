import { ToeicSessionPage } from "@/features/tests/run/ui/ToeicSessionPage";

type ToeicSessionRoutePageProps = {
  mode: "mock_test" | "practice" | "review_wrong";
  params: Promise<{ sessionId: string }>;
};

export function ToeicSessionRoutePage({
  mode,
  params,
}: ToeicSessionRoutePageProps) {
  return <ToeicSessionPage mode={mode} params={params} />;
}
