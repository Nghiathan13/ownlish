import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthQueryReset } from "./AuthQueryReset";

const mocks = vi.hoisted(() => ({ useAuthSession: vi.fn() }));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
}));

function renderReset(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthQueryReset />
    </QueryClientProvider>,
  );
}

describe("AuthQueryReset", () => {
  it("keeps query data for the initial authenticated user, then clears it when users change", () => {
    const queryClient = new QueryClient();
    const clear = vi.spyOn(queryClient, "clear");
    mocks.useAuthSession.mockReturnValue({ status: "authenticated", user: { id: "first" } });
    const view = renderReset(queryClient);

    expect(clear).not.toHaveBeenCalled();
    mocks.useAuthSession.mockReturnValue({ status: "authenticated", user: { id: "second" } });
    view.rerender(
      <QueryClientProvider client={queryClient}><AuthQueryReset /></QueryClientProvider>,
    );
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("clears query data when an authenticated user becomes a guest", () => {
    const queryClient = new QueryClient();
    const clear = vi.spyOn(queryClient, "clear");
    mocks.useAuthSession.mockReturnValue({ status: "authenticated", user: { id: "first" } });
    const view = renderReset(queryClient);

    mocks.useAuthSession.mockReturnValue({ status: "guest", user: undefined });
    view.rerender(
      <QueryClientProvider client={queryClient}><AuthQueryReset /></QueryClientProvider>,
    );
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
