import { RequireAuth } from "@/features/auth";
import { DictationStudy } from "@/features/dictation/study/DictationStudy";

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
