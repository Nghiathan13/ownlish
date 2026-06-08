import { AuthForm } from "@/features/auth/components/AuthForm";
import { PageShell } from "@/shared/ui/PageShell";

export default function LoginPage() {
  return (
    <PageShell centered>
      <AuthForm />
    </PageShell>
  );
}
