"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import type { CollectionCategory } from "@/entities/collection/lib/collectionDisplay";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { getOxfordCollectionMetaQueryOptions } from "@/features/collections/oxford/model/oxfordQueries";
import { getCollectionsListQueryOptions } from "@/features/collections/shared/data/hooks/useCollectionsListQuery";
import { getOxfordPartReviewQueryOptions } from "@/features/review/oxford/model/oxfordReviewQueries";
import { OxfordReviewBandShell } from "@/features/review/oxford/components/OxfordReviewBandShell";
import { UserReviewWorkspace } from "@/features/review/user/components/UserReviewWorkspace";

type ReviewLocation = {
  band: string;
  category: CollectionCategory;
  part: string;
};

function getLocation(pathname: string): ReviewLocation {
  const match = pathname.match(/^\/review\/oxford\/([^/]+)\/([^/]+)$/);

  if (match) {
    return { band: match[1], category: "oxford", part: match[2] };
  }

  return { band: "A1", category: "user", part: "part-1" };
}

function getLocationPath(location: ReviewLocation) {
  return location.category === "oxford"
    ? `/review/oxford/${location.band}/${location.part}`
    : "/review";
}

export function ReviewRouteWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const userId = user?.id ?? null;
  const routeLocation = useMemo(() => getLocation(pathname), [pathname]);
  const [location, setLocation] = useState(routeLocation);
  const pendingPathRef = useRef<string | null>(null);

  useEffect(() => {
    const routePath = getLocationPath(routeLocation);
    if (pendingPathRef.current === null || pendingPathRef.current === routePath) {
      pendingPathRef.current = null;
      setLocation(routeLocation);
    }
  }, [routeLocation]);

  const navigateCategory = useCallback(
    (category: CollectionCategory) => {
      const nextLocation: ReviewLocation =
        category === "oxford"
          ? { band: "A1", category, part: "part-1" }
          : { band: "A1", category, part: "part-1" };
      const nextPath = getLocationPath(nextLocation);

      if (nextPath === pendingPathRef.current) {
        return;
      }

      pendingPathRef.current = nextPath;
      setLocation(nextLocation);

      if (window.location.pathname !== nextPath) {
        window.history.pushState(null, "", nextPath);
      }

      if (isAuthenticated && userId) {
        if (category === "oxford") {
          void Promise.all([
            queryClient.prefetchQuery(getOxfordCollectionMetaQueryOptions("A1")),
            queryClient.prefetchQuery(
              getOxfordPartReviewQueryOptions(userId, "A1", 1),
            ),
          ]);
        } else {
          void queryClient.prefetchQuery(getCollectionsListQueryOptions(userId));
        }
      }

      router.push(nextPath, { scroll: false });
    },
    [isAuthenticated, queryClient, router, userId],
  );

  return location.category === "oxford" ? (
    <OxfordReviewBandShell
      bandParam={location.band}
      onCategoryChange={navigateCategory}
      partParam={location.part}
    />
  ) : (
    <UserReviewWorkspace onCategoryChange={navigateCategory} />
  );
}
