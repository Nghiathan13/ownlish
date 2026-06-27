import { describe, expect, it, vi } from "vitest";
import {
  processAdminGroupEditorSaveResults,
  type AdminGroupEditorSaveTask,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorSave";

function makeTask(
  label: string,
  run: AdminGroupEditorSaveTask["run"],
): AdminGroupEditorSaveTask {
  return {
    errorLabel: label,
    onSuccess: vi.fn(),
    run,
  };
}

describe("processAdminGroupEditorSaveResults", () => {
  it("returns didSave true when all requests succeed", () => {
    const tasks = [
      makeTask("group content", async () => ({ group: { id: 1, content: "A" } })),
      makeTask("question 33", async () => ({
        question: { id: 33, question: "Q33" },
      })),
    ];

    const outcome = processAdminGroupEditorSaveResults(
      [
        { status: "fulfilled", value: { group: { id: 1, content: "A" } } },
        { status: "fulfilled", value: { question: { id: 33, question: "Q33" } } },
      ],
      tasks,
      () => null,
    );

    expect(outcome.didSave).toBe(true);
    expect(outcome.anySuccess).toBe(true);
    expect(outcome.error).toBeNull();
    expect(tasks[0]?.onSuccess).toHaveBeenCalledOnce();
    expect(tasks[1]?.onSuccess).toHaveBeenCalledOnce();
  });

  it("returns didSave false when some requests fail", () => {
    const tasks = [
      makeTask("group content", async () => ({ group: { id: 1, content: "A" } })),
      makeTask("question 33", async () => {
        throw new Error("boom");
      }),
    ];

    const outcome = processAdminGroupEditorSaveResults(
      [
        { status: "fulfilled", value: { group: { id: 1, content: "A" } } },
        { status: "rejected", reason: new Error("boom") },
      ],
      tasks,
      () => null,
    );

    expect(outcome.didSave).toBe(false);
    expect(outcome.anySuccess).toBe(true);
    expect(outcome.error).toBe("Failed to save question 33");
    expect(tasks[0]?.onSuccess).toHaveBeenCalledOnce();
    expect(tasks[1]?.onSuccess).not.toHaveBeenCalled();
  });
});
