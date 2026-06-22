import { BackToCollectionsLink } from "@/features/collections/components/BackToCollectionsLink";
import { PageShell } from "@/shared/ui/PageShell";

export default function CollectionDetailLoading() {
  return (
    <PageShell fillViewport>
      <BackToCollectionsLink />
    </PageShell>
  );
}
