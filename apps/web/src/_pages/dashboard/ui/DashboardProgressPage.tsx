"use client";

import { DashboardProgressPanel } from "@/features/dashboard-progress";
import { DashboardCollectionGate } from "./DashboardCollectionGate";
import { DashboardProgressSkeleton } from "./DashboardProgressSkeleton";
import { DashboardScreen } from "./DashboardScreen";

export function DashboardProgressPage() {
  return (
    <DashboardScreen>
      <DashboardCollectionGate skeleton={<DashboardProgressSkeleton />}>
        <DashboardProgressPanel />
      </DashboardCollectionGate>
    </DashboardScreen>
  );
}
