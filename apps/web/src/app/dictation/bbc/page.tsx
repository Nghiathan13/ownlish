import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { DictationLibrary } from "@/features/dictation/catalog/DictationLibrary";

export default function DictationBbcPage() {
  return (
    <RequireAuth>
      <DictationLibrary category="BBC" />
    </RequireAuth>
  );
}
