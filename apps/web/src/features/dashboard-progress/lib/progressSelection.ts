export type ProgressSelectionMode = "empty" | "all" | "single" | "multi";

export function getSelectionMode(
  selectedCount: number,
  isAllSelected: boolean,
): ProgressSelectionMode {
  if (selectedCount === 0) return "empty";
  if (isAllSelected) return "all";
  if (selectedCount === 1) return "single";
  return "multi";
}

export function isFullSelection(selected: string[], allIds: string[]) {
  return (
    allIds.length > 0 &&
    selected.length === allIds.length &&
    allIds.every((id) => selected.includes(id))
  );
}
