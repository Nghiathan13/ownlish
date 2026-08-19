import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { LandingVocabSection } from "./LandingVocabSection";

function renderVocabSection() {
  return render(
    <LocaleProvider>
      <LandingVocabSection />
    </LocaleProvider>,
  );
}

describe("LandingVocabSection", () => {
  it("shows the demo word hidden until the review card is clicked", async () => {
    const user = userEvent.setup();

    renderVocabSection();

    expect(screen.getByText("negotiate")).toBeInTheDocument();
    expect(screen.getByText("(v.)")).toBeInTheDocument();
    expect(screen.getByText("B2")).toBeInTheDocument();
    expect(screen.getByText("/nɪˈɡəʊʃieɪt/")).toBeInTheDocument();
    expect(screen.queryByText("đàm phán, thương lượng")).not.toBeInTheDocument();
    expect(
      screen.queryByText("They negotiated a better contract with the supplier."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reveal meaning" }));

    expect(screen.getByText("đàm phán, thương lượng")).toBeInTheDocument();
    expect(
      screen.getByText("They negotiated a better contract with the supplier."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide meaning" }));

    expect(screen.queryByText("đàm phán, thương lượng")).not.toBeInTheDocument();
    expect(
      screen.queryByText("They negotiated a better contract with the supplier."),
    ).not.toBeInTheDocument();
  });

  it("shows the static progress metrics", () => {
    renderVocabSection();

    expect(screen.getByText("Due for review").parentElement).toHaveTextContent(
      "1",
    );
    expect(screen.getByText("Mastered").parentElement).toHaveTextContent("0");
    expect(screen.getByText("Difficult").parentElement).toHaveTextContent("0");
  });
});
