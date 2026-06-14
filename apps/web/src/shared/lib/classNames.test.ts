import { describe, expect, it } from "vitest";
import { classNames } from "./classNames";

describe("classNames", () => {
  it("later padding and radius override earlier utilities", () => {
    expect(
      classNames(
        "rounded-lg px-3.5 py-2.5",
        "rounded-md px-2.5 py-1.5",
      ),
    ).toBe("rounded-md px-2.5 py-1.5");
  });

  it("keeps non-conflicting classes", () => {
    expect(
      classNames("inline-flex border", "gap-1.5 pl-8"),
    ).toBe("inline-flex border gap-1.5 pl-8");
  });

  it("skips falsy values", () => {
    expect(classNames("text-sm", false, null, undefined, "font-semibold")).toBe(
      "text-sm font-semibold",
    );
  });
});
