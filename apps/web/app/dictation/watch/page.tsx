import { DictationStudyPage } from "@/_pages/dictation";
import { parseDictationWatchVideoId } from "@/entities/dictation-library";
import { redirect } from "next/navigation";

type DictationWatchRouteProps = {
  searchParams: Promise<{
    v?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function DictationWatchRoute({
  searchParams,
}: DictationWatchRouteProps) {
  const params = await searchParams;
  const videoId = parseDictationWatchVideoId(getSingleSearchParam(params.v));

  if (videoId == null) {
    redirect("/dictation");
  }

  return <DictationStudyPage videoId={videoId} />;
}
