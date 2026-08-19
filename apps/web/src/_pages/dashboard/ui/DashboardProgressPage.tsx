"use client";

import {
  DashboardProgressPanel,
  type DashboardProgressMode,
} from "@/features/dashboard-progress";
import { DashboardCollectionGate } from "./DashboardCollectionGate";
import { DashboardProgressSkeleton } from "./DashboardProgressSkeleton";
import { DashboardScreen } from "./DashboardScreen";

type DashboardProgressPageProps = {
  mode: DashboardProgressMode;
};

export function DashboardProgressPage({ mode }: DashboardProgressPageProps) {
  return (
    <DashboardScreen>
      <DashboardCollectionGate skeleton={<DashboardProgressSkeleton />}>
        <DashboardProgressPanel mode={mode} />
      </DashboardCollectionGate>
    </DashboardScreen>
  );
}
