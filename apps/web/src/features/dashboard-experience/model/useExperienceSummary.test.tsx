import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getExperienceSummary = vi.hoisted(() => vi.fn());
vi.mock("@/entities/experience", () => ({ getExperienceSummary }));
vi.mock("@/entities/session", () => ({
  runAuthenticatedRequest: ({ request }: { request: (token: string) => unknown }) => request("token"),
}));

import { useExperienceSummary } from "./useExperienceSummary";

describe("useExperienceSummary", () => {
  it("fetches only when Dashboard Activity enables it", async () => {
    getExperienceSummary.mockResolvedValue({ totalXp: 880 });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) =>
        useExperienceSummary({
          enabled: props.enabled,
          isAuthenticated: true,
          userId: "user-1",
        }),
      { initialProps: { enabled: false }, wrapper },
    );
    expect(getExperienceSummary).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await waitFor(() => expect(result.current.totalXp).toBe(880));
    expect(getExperienceSummary).toHaveBeenCalledWith("token", expect.any(AbortSignal));
  });
});
