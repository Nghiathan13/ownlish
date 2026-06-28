const READING_INSTRUCTION_RANGE_PATTERN = /^(Questions \d+-\d+)(.*)$/;

export function splitReadingPartInstruction(instruction: string) {
  const match = instruction.match(READING_INSTRUCTION_RANGE_PATTERN);

  if (!match) {
    return null;
  }

  return {
    range: match[1]!,
    suffix: match[2]!,
  };
}
