import { RequireAdmin } from "@/features/auth/components/RequireAdmin";
import { AdminToeicTestDetailPage } from "@/features/admin/toeic/detail/components/AdminToeicTestDetailPage";

type AdminToeicTestDetailRouteProps = {
  params: Promise<{ testId: string }>;
};

export default async function AdminToeicTestDetailRoute({
  params,
}: AdminToeicTestDetailRouteProps) {
  const { testId } = await params;
  const parsedTestId = Number(testId);

  return (
    <RequireAdmin>
      <AdminToeicTestDetailPage testId={parsedTestId} />
    </RequireAdmin>
  );
}
