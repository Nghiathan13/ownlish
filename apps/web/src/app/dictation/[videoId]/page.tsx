import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { DictationStudy } from "@/features/dictation/study/DictationStudy";

type DictationStudyPageProps = {
  params: Promise<{ videoId: string }>;
};

export default async function DictationStudyPage({ params }: DictationStudyPageProps) {
  const { videoId } = await params;

  return (
    <RequireAuth>
      <DictationStudy videoId={videoId} />
    </RequireAuth>
  );
}
