import { RequireAdmin } from "@/features/auth/components/RequireAdmin";
import { AdminToeicTestsPage } from "@/features/admin/toeic/list/components/AdminToeicTestsPage";

export default function AdminToeicPage() {
  return (
    <RequireAdmin>
      <AdminToeicTestsPage />
    </RequireAdmin>
  );
}
