"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  getCollectionsListPath,
  getDefaultUserCollection,
  useCollectionsListQuery,
} from "@/entities/collection";
import { isAuthenticatedStatus, useAuthSession } from "@/entities/session";
import { useT } from "@/shared/lib/providers";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { ArrowForwardIcon } from "@/shared/ui/icons";

const dashboardButtonInteractionClassName =
  "gap-2 whitespace-nowrap transition duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px [&_svg]:size-5 [&_svg]:shrink-0";

type DashboardCollectionGateProps = {
  children: ReactNode;
  skeleton: ReactNode;
};

export function DashboardCollectionGate({
  children,
  skeleton,
}: DashboardCollectionGateProps) {
  const t = useT();
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const {
    collections,
    collectionsError,
    isLoadingCollections,
    reloadCollections,
  } = useCollectionsListQuery({
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const defaultCollection = getDefaultUserCollection(collections);

  if (isLoadingCollections) {
    return <div className="mt-6 px-4 lg:px-16">{skeleton}</div>;
  }

  if (collectionsError) {
    return (
      <div className="mt-6 px-4 lg:px-16">
        <DashboardMessage role="alert">
          <div>
            <p className="font-semibold text-foreground">
              {t("dashboard.collectionsLoadError")}
            </p>
            <p className="mt-1 text-sm">{collectionsError}</p>
          </div>
          <button
            className={secondaryTextButtonClassName(
              dashboardButtonInteractionClassName,
            )}
            onClick={() => void reloadCollections()}
            type="button"
          >
            {t("dashboard.tryAgain")}
          </button>
        </DashboardMessage>
      </div>
    );
  }

  if (!defaultCollection) {
    return (
      <div className="mt-6 px-4 lg:px-16">
        <DashboardMessage>
          <div className="max-w-xl">
            <p className="font-semibold text-foreground">
              {t("dashboard.setupTitle")}
            </p>
            <p className="mt-1 text-sm leading-6">
              {t("dashboard.setupDescription")}
            </p>
          </div>
          <Link
            className={primaryTextButtonClassName(
              dashboardButtonInteractionClassName,
            )}
            href={getCollectionsListPath("user")}
          >
            {t("dashboard.browseCollections")}
            <ArrowForwardIcon />
          </Link>
        </DashboardMessage>
      </div>
    );
  }

  return children;
}

function DashboardMessage({
  children,
  role,
}: {
  children: ReactNode;
  role?: "alert";
}) {
  return (
    <section
      className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-surface p-6 text-muted-foreground sm:flex-row sm:items-center sm:p-8"
      role={role}
    >
      {children}
    </section>
  );
}
