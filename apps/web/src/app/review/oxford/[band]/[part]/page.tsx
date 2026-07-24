import { notFound } from "next/navigation";
import {
  parseOxfordBand,
  parseOxfordGroup,
} from "@/features/collections/oxford/lib/oxfordNavigation";

type OxfordPartReviewRouteProps = {
  params: Promise<{
    band: string;
    part: string;
  }>;
};

/** Validates route params; the review session lives in the oxford layout shell. */
export default async function OxfordPartReviewRoute({
  params,
}: OxfordPartReviewRouteProps) {
  const { band: bandParam, part: partParam } = await params;
  const band = parseOxfordBand(bandParam);
  const part = parseOxfordGroup(partParam);

  if (!band || !part) {
    notFound();
  }

  return null;
}
