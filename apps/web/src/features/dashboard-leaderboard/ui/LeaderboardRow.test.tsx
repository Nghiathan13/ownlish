import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeaderboardRow } from "./LeaderboardRow";

describe("LeaderboardRow", () => {
  it("renders a top-three learner with a prepared metric value", () => {
    render(
      <LeaderboardRow
        entry={{
          rank: 1,
          displayName: "Linh",
          avatarUrl: null,
          value: "2 h 5 min",
        }}
      />,
    );

    expect(screen.getByText("#1")).toHaveClass("text-warning");
    expect(screen.getByText("Linh")).toBeInTheDocument();
    expect(screen.getByText("2 h 5 min")).toBeInTheDocument();
  });
});
