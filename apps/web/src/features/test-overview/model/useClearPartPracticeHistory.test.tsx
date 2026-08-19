import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useClearPartPracticeHistory } from "./useClearPartPracticeHistory";

const clearRuntimePartPracticeRun = vi.hoisted(() => vi.fn());
const clearPartPracticeGroupKeys = vi.hoisted(() => vi.fn());

vi.mock("@/entities/toeic-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/toeic-runtime")>()),
  clearRuntimePartPracticeRun,
  clearPartPracticeGroupKeys,
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  runAuthenticatedRequest: ({
    request,
  }: {
    request: (token: string) => unknown;
  }) => request("token"),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useClearPartPracticeHistory", () => {
  it("clears a part and local group keys", async () => {
    clearRuntimePartPracticeRun.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useClearPartPracticeHistory({ userId: "user-1" }),
      { wrapper },
    );

    await act(async () => {
      await result.current.clearHistory(3);
    });

    await waitFor(() => expect(clearRuntimePartPracticeRun).toHaveBeenCalledWith("token", 3));
    expect(clearPartPracticeGroupKeys).toHaveBeenCalledWith(3);
  });
});
