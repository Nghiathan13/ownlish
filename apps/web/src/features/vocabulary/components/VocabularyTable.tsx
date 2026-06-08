import type { VocabWord } from "@/entities/vocab/api/vocab";
import { Button } from "@/shared/ui/Button";

type VocabularyTableProps = {
  deletingWordId: string | null;
  onDelete: (word: VocabWord) => void;
  words: VocabWord[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function VocabularyTable({
  deletingWordId,
  onDelete,
  words,
}: VocabularyTableProps) {
  return (
    <table className="min-w-[760px] w-full border-collapse text-left text-sm">
      <thead className="border-b border-border bg-muted">
        <tr>
          <th className="px-4 py-3 font-semibold">Word</th>
          <th className="px-4 py-3 font-semibold">Type</th>
          <th className="px-4 py-3 font-semibold">Meaning</th>
          <th className="px-4 py-3 font-semibold">Level</th>
          <th className="px-4 py-3 font-semibold">Next review</th>
          <th className="px-4 py-3 font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {words.map((word) => (
          <tr key={word.id} className="border-b border-border">
            <td className="px-4 py-3 font-semibold">{word.word}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {word.type || "-"}
            </td>
            <td className="px-4 py-3">{word.meaningVi || "-"}</td>
            <td className="px-4 py-3">{word.level}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {formatDate(word.nextReview)}
            </td>
            <td className="px-4 py-3">
              <Button
                type="button"
                variant="secondary"
                disabled={deletingWordId === word.id}
                onClick={() => onDelete(word)}
              >
                {deletingWordId === word.id ? "Deleting..." : "Delete"}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
