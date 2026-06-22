import type { VocabWordDefinition } from "@/entities/vocab/api/vocab";

export type IpaField = "uk" | "us";

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

export function getIpaFieldValue(
  definition: VocabWordDefinition | null,
  field: IpaField,
) {
  const pair = getDefinitionIpaPair(definition);
  return pair[field];
}

export function hasUniformIpaField(
  definitions: VocabWordDefinition[],
  field: IpaField,
) {
  if (definitions.length === 0) {
    return true;
  }

  const values = new Set(
    definitions.map((definition) => getIpaFieldValue(definition, field) ?? ""),
  );

  return values.size <= 1;
}

export function getSharedIpaField(
  definitions: VocabWordDefinition[],
  field: IpaField,
) {
  return getIpaFieldValue(definitions[0] ?? null, field);
}

export function hasUniformIpaUk(definitions: VocabWordDefinition[]) {
  return hasUniformIpaField(definitions, "uk");
}

export function hasUniformIpaUs(definitions: VocabWordDefinition[]) {
  return hasUniformIpaField(definitions, "us");
}

export function getSharedIpaUk(definitions: VocabWordDefinition[]) {
  return getSharedIpaField(definitions, "uk");
}

export function getSharedIpaUs(definitions: VocabWordDefinition[]) {
  return getSharedIpaField(definitions, "us");
}

export function formatIpaDisplay(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const core = trimmed.replace(/^\/+|\/+$/g, "");

  return `/${core}/`;
}
