import { RequireAdmin } from "@/features/auth";
import { AdminDashboard } from "./AdminDashboard";

export function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}
