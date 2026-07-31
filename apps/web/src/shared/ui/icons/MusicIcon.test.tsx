import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MusicIcon } from "./MusicIcon";

describe("MusicIcon", () => {
  it("renders the shared music SVG icon", () => {
    render(<MusicIcon data-testid="music-icon" />);

    expect(screen.getByTestId("music-icon")).toHaveAttribute(
      "viewBox",
      "0 -960 960 960",
    );
  });
});
