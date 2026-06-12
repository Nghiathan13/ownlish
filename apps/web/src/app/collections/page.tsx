import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { CollectionsPage } from "@/features/collections/components/CollectionsPage";

export default function CollectionsRoute() {
  return (
    <RequireAuth>
      <CollectionsPage />
    </RequireAuth>
  );
}
