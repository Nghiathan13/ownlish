import { PartPracticePage } from "@/_pages/tests";
import {
  DEFAULT_TOEIC_PART,
  getTestsOverviewPath,
  parsePracticeOverviewPartParam,
} from "@/entities/toeic-runtime";
import { redirect } from "next/navigation";

type PartPracticeRouteProps = {
  searchParams: Promise<{
    part?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function PartPracticeRoute({
  searchParams,
}: PartPracticeRouteProps) {
  const params = await searchParams;
  const partNumber = parsePracticeOverviewPartParam(
    getSingleSearchParam(params.part),
  );

  if (partNumber == null) {
    redirect(getTestsOverviewPath({ tab: "part_practice", part: DEFAULT_TOEIC_PART }));
  }

  return <PartPracticePage partNumber={partNumber} />;
}
