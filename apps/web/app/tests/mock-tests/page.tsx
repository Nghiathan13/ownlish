import { MockTestsPage } from "@/_pages/tests";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
  parseToeicYearParam,
} from "@/entities/toeic-runtime";
import { redirect } from "next/navigation";

type MockTestsRouteProps = {
  searchParams: Promise<{
    year?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function MockTestsRoute({
  searchParams,
}: MockTestsRouteProps) {
  const params = await searchParams;
  const year = parseToeicYearParam(getSingleSearchParam(params.year));

  if (year == null) {
    redirect(getTestsListPath(DEFAULT_TOEIC_YEAR));
  }

  return <MockTestsPage year={year} />;
}
