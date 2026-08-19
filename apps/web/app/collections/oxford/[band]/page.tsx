import { getOxfordLegacyPathRedirect } from "@/entities/collection";
import { redirect } from "next/navigation";

type OxfordBandLegacyRouteProps = {
  params: Promise<{ band: string }>;
};

export default async function OxfordBandLegacyRoute({
  params,
}: OxfordBandLegacyRouteProps) {
  const { band } = await params;
  redirect(getOxfordLegacyPathRedirect(band));
}
