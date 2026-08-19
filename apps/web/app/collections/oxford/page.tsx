import { OxfordCollectionsPage } from "@/_pages/collections";
import { getOxfordPathRedirectTarget } from "@/entities/collection";
import { redirect } from "next/navigation";

type OxfordCollectionsRouteProps = {
  searchParams: Promise<{
    band?: string | string[];
    group?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function OxfordCollectionsRoute({
  searchParams,
}: OxfordCollectionsRouteProps) {
  const params = await searchParams;
  const redirectTarget = getOxfordPathRedirectTarget({
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
    <OxfordCollectionsPage
      band={getSingleSearchParam(params.band)}
      group={getSingleSearchParam(params.group)}
    />
  );
}
