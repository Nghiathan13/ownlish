"use client";

import { DashboardActivityPanel } from "@/features/dashboard-activity";
import { DashboardActivitySkeleton } from "./DashboardActivitySkeleton";
import { DashboardCollectionGate } from "./DashboardCollectionGate";
import { DashboardScreen } from "./DashboardScreen";

export function DashboardActivityPage() {
  return (
    <DashboardScreen>
      <DashboardCollectionGate skeleton={<DashboardActivitySkeleton />}>
        <div className="mt-6 min-h-0 flex-1 px-4 pb-4 lg:px-16 lg:pb-8">
          <DashboardActivityPanel />
        </div>
      </DashboardCollectionGate>
    </DashboardScreen>
  );
}
