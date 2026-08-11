import { RequireAdmin } from "@/features/auth";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";

export function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}
