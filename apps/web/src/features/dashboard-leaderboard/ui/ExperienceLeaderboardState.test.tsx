import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { ExperienceLeaderboardState } from "./ExperienceLeaderboardState";

describe("ExperienceLeaderboardState", () => {
  it("explains that Experience is intentionally deferred to V2", () => {
    render(
      <LocaleProvider>
        <ExperienceLeaderboardState />
      </LocaleProvider>,
    );

    expect(
      screen.getByText("The Experience leaderboard is coming in V2."),
    ).toBeInTheDocument();
  });
});
