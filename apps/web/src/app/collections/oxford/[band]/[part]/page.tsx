import { CollectionsPage } from "@/features/collections/list/components/CollectionsPage";

type OxfordPartPageProps = {
  params: Promise<{ band: string; part: string }>;
};

export default async function OxfordPartPage({ params }: OxfordPartPageProps) {
  const { band, part } = await params;

  return (
    <CollectionsPage bandParam={band} category="oxford" groupParam={part} />
  );
}
