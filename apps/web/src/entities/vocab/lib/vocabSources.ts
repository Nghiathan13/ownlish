export const OXFORD_DEFINITION_SOURCES = ["oxford_3000", "oxford_5000"] as const;

export type OxfordDefinitionSource = (typeof OXFORD_DEFINITION_SOURCES)[number];

export function isOxfordDefinitionSource(
  source: string,
): source is OxfordDefinitionSource {
  return (OXFORD_DEFINITION_SOURCES as readonly string[]).includes(source);
}
