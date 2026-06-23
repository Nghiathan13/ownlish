import type { UpdateCollectionInput } from "@/entities/collection/api/collections";

export type ImportCollectionVariables = {
  catalogDefinitionIds?: string[];
  systemCollectionId: string;
  targetCollectionId?: string;
};

export type UpdateCollectionVariables = {
  collectionId: string;
  input: UpdateCollectionInput;
};
