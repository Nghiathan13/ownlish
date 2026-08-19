import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PartPracticePage } from "./PartPracticePage";

vi.mock("./overview/components/TestsOverviewTabs", () => ({
  TestsOverviewTabs: () => <div data-testid="tests-overview-tabs" />,
}));
vi.mock("./overview/components/PracticeTab", () => ({
  PracticeTab: () => <div data-testid="practice-tab" />,
}));
vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/shared/ui/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("PartPracticePage", () => {
  it("renders part practice as its own page with tests tabs", () => {
    render(<PartPracticePage />);

    expect(screen.getByTestId("tests-overview-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("practice-tab")).toBeInTheDocument();
  });
});
