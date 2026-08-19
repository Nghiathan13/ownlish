import { getOxfordReviewLegacyPathRedirect } from "@/_pages/review";
import { redirect } from "next/navigation";

type OxfordReviewPartLegacyRouteProps = {
  params: Promise<{ band: string; part: string }>;
};

export default async function OxfordReviewPartLegacyRoute({
  params,
}: OxfordReviewPartLegacyRouteProps) {
  const { band, part } = await params;
  redirect(getOxfordReviewLegacyPathRedirect(band, part));
}
