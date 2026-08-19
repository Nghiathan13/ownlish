import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { MockTestHistoryPanel } from "./MockTestHistoryPanel";

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  useMockTestHistory: vi.fn(),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("../model/useMockTestHistory", () => ({
  useMockTestHistory: mocks.useMockTestHistory,
}));

const completedItem = {
  sessionId: "session-completed",
  selectedParts: [1, 2, 3, 4, 5, 6, 7],
  status: "completed" as const,
  correctCount: 80,
  wrongCount: 20,
  score: { listening: 400, reading: 390, total: 790 },
};

const openItem = {
  sessionId: "session-open",
  selectedParts: [1, 2],
  status: "open" as const,
};

describe("MockTestHistoryPanel", () => {
  it("lists completed mocks and opens a result", async () => {
    const user = userEvent.setup();
    const onViewResult = vi.fn();
    const onClose = vi.fn();
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.useMockTestHistory.mockReturnValue({
      items: [completedItem, openItem],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(
      <LocaleProvider>
        <MockTestHistoryPanel
          onClose={onClose}
          onViewResult={onViewResult}
          testKey="ets-2023-1"
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("790")).toBeInTheDocument();
    expect(screen.getByText("Full test")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View result" }));
    expect(onViewResult).toHaveBeenCalledWith("session-completed", [
      1, 2, 3, 4, 5, 6, 7,
    ]);

    await user.click(screen.getByRole("tab", { name: "In progress" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onViewResult).toHaveBeenCalledWith("session-open", [1, 2]);
  });

  it("retries after a history load error", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.useMockTestHistory.mockReturnValue({
      items: [],
      isLoading: false,
      error: "Cannot load mock test history.",
      reload,
    });

    render(
      <LocaleProvider>
        <MockTestHistoryPanel
          onClose={vi.fn()}
          onViewResult={vi.fn()}
          testKey="ets-2023-1"
        />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
