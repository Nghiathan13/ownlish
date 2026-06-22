export type IpaField = "uk" | "us";

export type DefinitionIpaPair = {
  uk: string | null;
  us: string | null;
};

type IpaDefinitionSource = {
  ipaUk?: string | null;
  ipaUs?: string | null;
} | null;

export function getDefinitionIpaPair(
  definition: IpaDefinitionSource,
): DefinitionIpaPair {
  return {
    uk: definition?.ipaUk ?? null,
    us: definition?.ipaUs ?? null,
  };
}

export function getIpaFieldValue(
  definition: IpaDefinitionSource,
  field: IpaField,
) {
  const pair = getDefinitionIpaPair(definition);
  return pair[field];
}

export function hasUniformIpaField(
  definitions: ReadonlyArray<IpaDefinitionSource & object>,
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
  definitions: ReadonlyArray<IpaDefinitionSource & object>,
  field: IpaField,
) {
  return getIpaFieldValue(definitions[0] ?? null, field);
}

export function hasUniformIpaUk(
  definitions: ReadonlyArray<IpaDefinitionSource & object>,
) {
  return hasUniformIpaField(definitions, "uk");
}

export function hasUniformIpaUs(
  definitions: ReadonlyArray<IpaDefinitionSource & object>,
) {
  return hasUniformIpaField(definitions, "us");
}

export function getSharedIpaUk(
  definitions: ReadonlyArray<IpaDefinitionSource & object>,
) {
  return getSharedIpaField(definitions, "uk");
}

export function getSharedIpaUs(
  definitions: ReadonlyArray<IpaDefinitionSource & object>,
) {
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
