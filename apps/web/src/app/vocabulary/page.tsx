"use client";

import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { MyVocabularyWordsPanel } from "@/features/vocabulary/components/MyVocabularyWordsPanel";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

export default function VocabularyPage() {
  return (
    <RequireAuth>
      <PageShell fillViewport>
        <Panel className="flex min-h-0 flex-1 flex-col">
          <MyVocabularyWordsPanel />
        </Panel>
      </PageShell>
    </RequireAuth>
  );
}
