import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarCollapsed } from "./useSidebarCollapsed";

describe("useSidebarCollapsed", () => {
  beforeEach(() => window.localStorage.clear());

  it("uses false by default and synchronizes changes across mounted consumers", () => {
    const first = renderHook(() => useSidebarCollapsed());
    const second = renderHook(() => useSidebarCollapsed());

    expect(first.result.current.collapsed).toBe(false);
    act(() => first.result.current.setCollapsed(true));
    expect(second.result.current.collapsed).toBe(true);
    expect(window.localStorage.getItem("ownlish.sidebar.collapsed")).toBe("true");
  });

  it("reads a persisted collapsed value on mount", () => {
    window.localStorage.setItem("ownlish.sidebar.collapsed", "true");
    const { result } = renderHook(() => useSidebarCollapsed());

    expect(result.current.collapsed).toBe(true);
  });
});
