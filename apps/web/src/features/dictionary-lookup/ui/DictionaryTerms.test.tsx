import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DictionaryTerms } from "./DictionaryTerms";

describe("DictionaryTerms", () => {
  it("renders a label and comma-separated terms", () => {
    render(<DictionaryTerms items={["formal", "grammar"]} label="Labels" />);

    expect(screen.getByText("formal, grammar").parentElement).toHaveTextContent(
      "Labels: formal, grammar",
    );
  });

  it("renders nothing without terms", () => {
    const { container } = render(<DictionaryTerms items={[]} label="Labels" />);

    expect(container).toBeEmptyDOMElement();
  });
});
