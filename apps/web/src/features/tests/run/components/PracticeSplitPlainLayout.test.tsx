import { render, screen, waitFor } from "@testing-library/react";
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

  it("starts with an unfocusable pointer-only separator", () => {
    renderLayout();

    const separator = screen.getByRole("separator", {
      name: "Resize question and answer panels",
    });

    expect(separator).not.toHaveAttribute("tabindex");
  });

  it("restores the saved desktop panel ratio", async () => {
    window.localStorage.setItem(STORAGE_KEY, "65");
    renderLayout();

    await waitFor(() => {
      expect(
        screen.getByRole("separator").parentElement?.style.getPropertyValue(
          "--tests-split-left-panel-width",
        ),
      ).toBe("65%");
    });
  });
});
