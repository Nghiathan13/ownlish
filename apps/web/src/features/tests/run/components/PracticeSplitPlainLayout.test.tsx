import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PracticeSplitPlainLayout } from "@/features/tests/run/components/PracticeSplitPlainLayout";

const STORAGE_KEY = "engvocab:tests-split-left-panel-width";

function renderLayout() {
  return render(
    <PracticeSplitPlainLayout left={<p>Question</p>} right={<p>Answer</p>} />,
  );
}

describe("PracticeSplitPlainLayout", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resizes the desktop panels with the keyboard and persists the ratio", async () => {
    renderLayout();

    const separator = screen.getByRole("separator", {
      name: "Resize question and answer panels",
    });

    expect(separator).toHaveAttribute("aria-valuenow", "50");

    fireEvent.keyDown(separator, { key: "ArrowRight" });

    expect(separator).toHaveAttribute("aria-valuenow", "52");
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("52");
    });
  });

  it("restores the saved desktop panel ratio", async () => {
    window.localStorage.setItem(STORAGE_KEY, "65");
    renderLayout();

    await waitFor(() => {
      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-valuenow",
        "65",
      );
    });
  });
});
