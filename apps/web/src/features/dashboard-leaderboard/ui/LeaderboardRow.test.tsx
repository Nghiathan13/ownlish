import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeaderboardRow } from "./LeaderboardRow";

describe("LeaderboardRow", () => {
  it("renders a top-three learner with formatted study time", () => {
    render(
      <LeaderboardRow
        entry={{
          rank: 1,
          displayName: "Linh",
          avatarUrl: null,
          studySeconds: 7_500,
        }}
        locale="en"
      />,
    );

    expect(screen.getByText("#1")).toHaveClass("text-warning");
    expect(screen.getByText("Linh")).toBeInTheDocument();
    expect(screen.getByText("2 h 5 min")).toBeInTheDocument();
  });
});
