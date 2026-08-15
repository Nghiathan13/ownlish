import type { DictionaryEntry } from "@/entities/dictionary";
import { DictionaryEtymologyView } from "./DictionaryEtymologyView";

export function DictionaryEntryContent({ entry }: { entry: DictionaryEntry }) {
  return (
    <div className="grid gap-4">
      {entry.etymologies.map((etymology, index) => (
        <DictionaryEtymologyView
          etymology={etymology}
          index={index}
          key={`${etymology.etymology}-${index}`}
        />
      ))}
    </div>
  );
}
