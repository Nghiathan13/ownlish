import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { CollectionDetailPage } from "@/features/collections/components/CollectionDetailPage";

type CollectionDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CollectionDetailRoute({
  params,
}: CollectionDetailRouteProps) {
  const { slug } = await params;

  return (
    <RequireAuth>
      <CollectionDetailPage slug={slug} />
    </RequireAuth>
  );
}
