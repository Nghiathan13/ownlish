import { DictationStudyPage } from "@/_pages/dictation";

type DictationStudyPageProps = {
  params: Promise<{ videoId: string }>;
};

export default async function Page({ params }: DictationStudyPageProps) {
  const { videoId } = await params;

  return <DictationStudyPage videoId={videoId} />;
}
