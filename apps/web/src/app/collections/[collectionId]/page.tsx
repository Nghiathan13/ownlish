import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { CollectionDetailPage } from "@/features/collections/components/CollectionDetailPage";

type CollectionDetailRouteProps = {
  params: Promise<{
    collectionId: string;
  }>;
};

export default async function CollectionDetailRoute({
  params,
}: CollectionDetailRouteProps) {
  const { collectionId } = await params;

  return (
    <RequireAuth>
      <CollectionDetailPage collectionId={collectionId} />
    </RequireAuth>
  );
}
