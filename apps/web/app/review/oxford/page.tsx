import { OxfordReviewPage, getOxfordReviewPathRedirectTarget } from "@/_pages/review";
import { DEFAULT_OXFORD_BAND } from "@/entities/collection";
import { DEFAULT_OXFORD_REVIEW_GROUP } from "@/features/review";
import { redirect } from "next/navigation";

type OxfordReviewRouteProps = {
  searchParams: Promise<{
    band?: string | string[];
    group?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function OxfordReviewRoute({
  searchParams,
}: OxfordReviewRouteProps) {
  const params = await searchParams;
  const redirectTarget = getOxfordReviewPathRedirectTarget({
    get(key: string) {
      if (key === "band") return getSingleSearchParam(params.band);
      if (key === "group") return getSingleSearchParam(params.group);
      return null;
    },
  });

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <OxfordReviewPage
      band={getSingleSearchParam(params.band) ?? DEFAULT_OXFORD_BAND}
      group={
        getSingleSearchParam(params.group) ?? String(DEFAULT_OXFORD_REVIEW_GROUP)
      }
    />
  );
}
