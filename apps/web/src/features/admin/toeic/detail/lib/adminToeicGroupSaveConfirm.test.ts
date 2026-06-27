import { describe, expect, it, vi } from "vitest";
import { resolveAdminGroupSaveConfirm } from "@/features/admin/toeic/detail/lib/adminToeicGroupSaveConfirm";

describe("resolveAdminGroupSaveConfirm", () => {
  it("closes the confirm dialog without exiting edit mode on partial save", async () => {
    const save = vi.fn(async () => ({ didSave: false, error: null }));
    const closeConfirm = vi.fn();
    const onExitEdit = vi.fn();

    const didSave = await resolveAdminGroupSaveConfirm({
      closeConfirm,
      onExitEdit,
      save,
    });

    expect(didSave).toBe(false);
    expect(save).toHaveBeenCalledOnce();
    expect(closeConfirm).toHaveBeenCalledOnce();
    expect(onExitEdit).not.toHaveBeenCalled();
  });

  it("closes the confirm dialog and exits edit mode on full save", async () => {
    const save = vi.fn(async () => ({ didSave: true, error: null }));
    const closeConfirm = vi.fn();
    const onExitEdit = vi.fn();

    const didSave = await resolveAdminGroupSaveConfirm({
      closeConfirm,
      onExitEdit,
      save,
    });

    expect(didSave).toBe(true);
    expect(save).toHaveBeenCalledOnce();
    expect(closeConfirm).toHaveBeenCalledOnce();
    expect(onExitEdit).toHaveBeenCalledOnce();
  });
});
