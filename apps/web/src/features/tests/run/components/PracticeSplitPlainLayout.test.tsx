import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("only resizes after the pointer moves more than six pixels", async () => {
    renderLayout();

    const separator = screen.getByRole("separator");
    const container = separator.parentElement as HTMLDivElement;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      width: 1000,
    } as DOMRect);
    Object.assign(separator, {
      hasPointerCapture: vi.fn().mockReturnValue(true),
      releasePointerCapture: vi.fn(),
      setPointerCapture: vi.fn(),
    });

    fireEvent.pointerDown(separator, { clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(separator, { clientX: 506, pointerId: 1 });

    expect(
      container.style.getPropertyValue("--tests-split-left-panel-width"),
    ).toBe("50%");

    fireEvent.pointerMove(separator, { clientX: 507, pointerId: 1 });

    await waitFor(() => {
      expect(
        container.style.getPropertyValue("--tests-split-left-panel-width"),
      ).toBe("50.7%");
    });
  });

  it("resets the desktop panels to an even split on double click", async () => {
    window.localStorage.setItem(STORAGE_KEY, "65");
    renderLayout();

    const separator = screen.getByRole("separator");
    const container = separator.parentElement as HTMLDivElement;
    fireEvent.doubleClick(separator);

    await waitFor(() => {
      expect(
        container.style.getPropertyValue("--tests-split-left-panel-width"),
      ).toBe("50%");
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("50");
    });
  });
});
