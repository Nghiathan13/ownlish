import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionLoadingSkeleton } from "./SessionLoadingSkeleton";

describe("SessionLoadingSkeleton", () => {
  it("renders a centered spinner", () => {
    render(<SessionLoadingSkeleton />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});
