import type { PracticeMode } from "@/entities/toeic/api/types";
import { ToeicSessionPage } from "./ToeicSessionPage";

type ToeicRunPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  mode: PracticeMode;
};

export function ToeicRunPage({ params, mode }: ToeicRunPageProps) {
  return <ToeicSessionPage mode={mode} params={params} />;
}
