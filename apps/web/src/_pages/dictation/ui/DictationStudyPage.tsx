import { RequireAuth } from "@/features/auth";
import { DictationStudy } from "./study/DictationStudy";

type DictationStudyPageProps = {
  videoId: string;
};

export function DictationStudyPage({ videoId }: DictationStudyPageProps) {
  return (
    <RequireAuth>
      <DictationStudy videoId={videoId} />
    </RequireAuth>
  );
}
