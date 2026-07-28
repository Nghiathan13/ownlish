import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { DictationLibrary } from "@/features/dictation/catalog/DictationLibrary";

export default function DictationPage() {
  return (
    <RequireAuth>
      <DictationLibrary />
    </RequireAuth>
  );
}
