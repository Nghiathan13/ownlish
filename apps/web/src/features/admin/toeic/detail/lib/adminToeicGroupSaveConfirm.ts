export async function resolveAdminGroupSaveConfirm(params: {
  closeConfirm: () => void;
  onExitEdit: () => void;
  save: () => Promise<{ didSave: boolean; error: string | null }>;
}) {
  const { didSave } = await params.save();
  params.closeConfirm();

  if (didSave) {
    params.onExitEdit();
  }

  return didSave;
}
