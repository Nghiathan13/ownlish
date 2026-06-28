import { splitReadingPartInstruction } from "@/features/tests/shared/lib/splitReadingPartInstruction";

type PartInstructionTextProps = {
  instruction: string;
  partNumber: number;
};

export function PartInstructionText({
  instruction,
  partNumber,
}: PartInstructionTextProps) {
  const readingParts =
    partNumber === 6 || partNumber === 7
      ? splitReadingPartInstruction(instruction)
      : null;

  if (readingParts) {
    return (
      <p className="text-base text-foreground select-text">
        <span className="font-bold">{readingParts.range}</span>
        {readingParts.suffix}
      </p>
    );
  }

  return (
    <p className="text-base font-bold text-foreground select-text">
      {instruction}
    </p>
  );
}
