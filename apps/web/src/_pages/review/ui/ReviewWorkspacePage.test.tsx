import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { createTestQueryClient } from "@/shared/lib/testing";
import { ReviewWorkspacePage } from "./ReviewWorkspacePage";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  useAuthSession: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/features/review", () => ({
  OxfordReviewBandShell: ({
    bandParam,
    partParam,
  }: {
    bandParam: string;
    partParam: string;
  }) => (
    <div>
      Oxford review {bandParam} {partParam}
    </div>
  ),
  UserReviewWorkspace: () => <div>User review workspace</div>,
}));

function renderPage() {
  const queryClient = createTestQueryClient();
  const prefetchQuery = vi
    .spyOn(queryClient, "prefetchQuery")
    .mockResolvedValue(undefined);

  render(
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ReviewWorkspacePage />
      </LocaleProvider>
    </QueryClientProvider>,
  );

  return { prefetchQuery };
}

describe("ReviewWorkspacePage", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.usePathname.mockReturnValue("/review");
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    window.history.replaceState(null, "", "/review");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("composes the user workspace on /review", () => {
    renderPage();

    expect(screen.getByRole("tab", { name: "My Collections" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("User review workspace")).toBeInTheDocument();
    expect(screen.queryByText(/Oxford review/)).not.toBeInTheDocument();
  });

  it("composes the Oxford workspace from the route params", () => {
    mocks.usePathname.mockReturnValue("/review/oxford/B1/part-3");
    window.history.replaceState(null, "", "/review/oxford/B1/part-3");

    renderPage();

    expect(screen.getByRole("tab", { name: "Oxford" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Oxford review B1 part-3")).toBeInTheDocument();
    expect(screen.queryByText("User review workspace")).not.toBeInTheDocument();
  });

  it("switches to Oxford immediately and prefetches the default part", async () => {
    const user = userEvent.setup();
    const { prefetchQuery } = renderPage();

    await user.click(screen.getByRole("tab", { name: "Oxford" }));

    expect(screen.getByText("Oxford review A1 part-1")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/review/oxford/A1/part-1");
    expect(prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["oxford-collection-meta", { userId: "user-1", band: "A1" }],
      }),
    );
    expect(prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["oxford-part-review", "user-1", "A1", 1],
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/review/oxford/A1/part-1", {
      scroll: false,
    });
    expect(prefetchQuery.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.push.mock.invocationCallOrder[0],
    );
  });

  it("switches back to the user workspace and prefetches collections", async () => {
    const user = userEvent.setup();
    mocks.usePathname.mockReturnValue("/review/oxford/A1/part-1");
    window.history.replaceState(null, "", "/review/oxford/A1/part-1");
    const { prefetchQuery } = renderPage();

    await user.click(screen.getByRole("tab", { name: "My Collections" }));

    expect(screen.getByText("User review workspace")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/review");
    expect(prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["collections", { userId: "user-1" }],
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/review", { scroll: false });
  });

  it("does not prefetch when the session is not authenticated", async () => {
    const user = userEvent.setup();
    mocks.useAuthSession.mockReturnValue({ status: "unauthenticated", user: null });
    const { prefetchQuery } = renderPage();

    await user.click(screen.getByRole("tab", { name: "Oxford" }));

    expect(screen.getByText("Oxford review A1 part-1")).toBeInTheDocument();
    expect(prefetchQuery).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith("/review/oxford/A1/part-1", {
      scroll: false,
    });
  });
});
