import { notFound } from "next/navigation";
import { parseOxfordBand } from "@/features/collections/oxford/lib/oxfordNavigation";

type OxfordBandPageProps = {
  params: Promise<{ band: string }>;
};

export default async function OxfordBandPage({ params }: OxfordBandPageProps) {
  const { band } = await params;

  if (!parseOxfordBand(band)) {
    notFound();
  }

  return null;
}
