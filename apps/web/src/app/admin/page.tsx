import { RequireAdmin } from "@/features/auth/components/RequireAdmin";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}
