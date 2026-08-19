import { OxfordCollectionsContent } from "./OxfordCollectionsContent";

type OxfordCollectionsPageProps = {
  band: string | null;
  group: string | null;
};

export function OxfordCollectionsPage({
  band,
  group,
}: OxfordCollectionsPageProps) {
  return (
    <OxfordCollectionsContent bandParam={band} groupParam={group} />
  );
}
