import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { DictationLibrary } from "@/features/dictation/catalog/DictationLibrary";

export default function DictationMusicPage() {
  return (
    <RequireAuth>
      <DictationLibrary category="Music" />
    </RequireAuth>
  );
}
