import { notFound } from "next/navigation";
import { parseOxfordBand } from "@/entities/collection";

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
