import { getOxfordReviewLegacyPathRedirect } from "@/_pages/review";
import { redirect } from "next/navigation";

type OxfordReviewBandLegacyRouteProps = {
  params: Promise<{ band: string }>;
};

export default async function OxfordReviewBandLegacyRoute({
  params,
}: OxfordReviewBandLegacyRouteProps) {
  const { band } = await params;
  redirect(getOxfordReviewLegacyPathRedirect(band));
}
