import { redirect } from "next/navigation";
import { getTestsOverviewRedirectTarget } from "@/entities/toeic-runtime";

type TestsIndexRouteProps = {
  searchParams: Promise<{
    part?: string | string[];
    tab?: string | string[];
    year?: string | string[];
  }>;
};

export default async function TestsIndexRoute({
  searchParams,
}: TestsIndexRouteProps) {
  const params = await searchParams;
  const legacySearchParams = new URLSearchParams();

  if (typeof params.tab === "string") {
    legacySearchParams.set("tab", params.tab);
  }
  if (typeof params.year === "string") {
    legacySearchParams.set("year", params.year);
  }
  if (typeof params.part === "string") {
    legacySearchParams.set("part", params.part);
  }

  redirect(getTestsOverviewRedirectTarget(legacySearchParams));
}
