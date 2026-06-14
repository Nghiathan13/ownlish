import type { VocabWordDefinition } from "@/entities/vocab/api/vocab";

export type DefinitionIpaPair = {
  uk: string | null;
  us: string | null;
};

export function getDefinitionIpaPair(
  definition: VocabWordDefinition | null,
): DefinitionIpaPair {
  return {
    uk: definition?.ipaUk ?? null,
    us: definition?.ipaUs ?? null,
  };
}

export function getIpaSignature(pair: DefinitionIpaPair) {
  return `${pair.uk ?? ""}|${pair.us ?? ""}`;
}

export function hasUniformIpa(definitions: VocabWordDefinition[]) {
  if (definitions.length === 0) {
    return true;
  }

  const signatures = new Set(
    definitions.map((definition) =>
      getIpaSignature(getDefinitionIpaPair(definition)),
    ),
  );

  return signatures.size <= 1;
}

export function getSharedIpaPair(
  definitions: VocabWordDefinition[],
): DefinitionIpaPair {
  return getDefinitionIpaPair(definitions[0] ?? null);
}

export function hasIpaContent(pair: DefinitionIpaPair) {
  return Boolean(pair.uk || pair.us);
}

export function formatIpaDisplay(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const core = trimmed.replace(/^\/+|\/+$/g, "");

  return `/${core}/`;
}
