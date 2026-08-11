import { RequireAuth } from "@/features/auth";
import { DictationLibrary } from "./catalog/DictationLibrary";

type DictationLibraryPageProps = {
  category?: string;
};

export function DictationLibraryPage({ category }: DictationLibraryPageProps) {
  return (
    <RequireAuth>
      <DictationLibrary category={category} />
    </RequireAuth>
  );
}
