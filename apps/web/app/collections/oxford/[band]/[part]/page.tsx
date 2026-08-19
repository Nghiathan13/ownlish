import { getOxfordLegacyPathRedirect } from "@/entities/collection";
import { redirect } from "next/navigation";

type OxfordPartLegacyRouteProps = {
  params: Promise<{ band: string; part: string }>;
};

export default async function OxfordPartLegacyRoute({
  params,
}: OxfordPartLegacyRouteProps) {
  const { band, part } = await params;
  redirect(getOxfordLegacyPathRedirect(band, part));
}
