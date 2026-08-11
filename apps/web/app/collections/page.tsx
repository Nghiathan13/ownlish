import { redirect } from "next/navigation";
import {
  getCollectionsLegacyRedirectPath,
  getCollectionsListPath,
} from "@/entities/collection/lib/collectionDisplay";

type CollectionsRootPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function CollectionsRootPage({
  searchParams,
}: CollectionsRootPageProps) {
  const params = await searchParams;
  const legacyPath = getCollectionsLegacyRedirectPath({
    get(key: string) {
      return firstParam(params[key]);
    },
  });

  redirect(legacyPath ?? getCollectionsListPath("user"));
}
