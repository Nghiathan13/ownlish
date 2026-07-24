import { notFound } from "next/navigation";
import {
  parseOxfordBand,
  parseOxfordGroup,
} from "@/features/collections/oxford/lib/oxfordNavigation";

type OxfordPartPageProps = {
  params: Promise<{ band: string; part: string }>;
};

export default async function OxfordPartPage({ params }: OxfordPartPageProps) {
  const { band, part } = await params;

  if (!parseOxfordBand(band) || !parseOxfordGroup(part)) {
    notFound();
  }

  return null;
}
