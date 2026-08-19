"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  getCollectionsListQueryOptions,
  type CollectionCategory,
} from "@/entities/collection";
import { getOxfordPartReviewQueryOptions } from "@/entities/review";
import { isAuthenticatedStatus, useAuthSession } from "@/entities/session";
import { getOxfordCollectionMetaQueryOptions } from "@/features/collections";
import {
  OxfordReviewBandShell,
  UserReviewWorkspace,
} from "@/features/review";
import { PageShell } from "@/shared/ui/PageShell";
import {
  getReviewLocation,
  getReviewLocationPath,
} from "../lib/reviewPaths";
import { ReviewCategoryTabs } from "./ReviewCategoryTabs";

export function ReviewWorkspacePage() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const userId = user?.id ?? null;
  const routeLocation = useMemo(() => getReviewLocation(pathname), [pathname]);
  const [location, setLocation] = useState(routeLocation);
  const pendingPathRef = useRef<string | null>(null);

  useEffect(() => {
    const routePath = getReviewLocationPath(routeLocation);
    if (pendingPathRef.current === null || pendingPathRef.current === routePath) {
      pendingPathRef.current = null;
      setLocation(routeLocation);
    }
  }, [routeLocation]);

  const navigateCategory = useCallback(
    (category: CollectionCategory) => {
      const nextLocation =
        category === "oxford"
          ? { band: "A1", category, part: "part-1" }
          : { band: "A1", category, part: "part-1" };
      const nextPath = getReviewLocationPath(nextLocation);

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
            queryClient.prefetchQuery(
              getOxfordCollectionMetaQueryOptions(userId, "A1"),
            ),
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

  return (
    <PageShell>
      <ReviewCategoryTabs
        activeCategory={location.category}
        onCategoryChange={navigateCategory}
      />
      {location.category === "oxford" ? (
        <OxfordReviewBandShell
          bandParam={location.band}
          partParam={location.part}
        />
      ) : (
        <UserReviewWorkspace />
      )}
    </PageShell>
  );
}
