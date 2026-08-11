import type { UpdateCollectionInput } from "@/entities/collection";

export type ImportCollectionVariables = {
  catalogDefinitionIds?: string[];
  limit?: number;
  offset?: number;
  systemCollectionId: string;
  targetCollectionId?: string;
};

export type UpdateCollectionVariables = {
  collectionId: string;
  input: UpdateCollectionInput;
};
