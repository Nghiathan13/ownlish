import { CollectionsPage } from "@/features/collections/list/components/CollectionsPage";

type OxfordBandPageProps = {
  params: Promise<{ band: string }>;
};

export default async function OxfordBandPage({ params }: OxfordBandPageProps) {
  const { band } = await params;

  return <CollectionsPage bandParam={band} category="oxford" />;
}
