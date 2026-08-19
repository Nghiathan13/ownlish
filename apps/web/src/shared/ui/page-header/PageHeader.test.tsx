import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders page-header content with the shared horizontal spacing", () => {
    render(
      <PageHeader>
        <p>Page navigation</p>
      </PageHeader>,
    );

    expect(screen.getByRole("banner")).toHaveClass("px-4", "lg:px-16");
    expect(screen.getByText("Page navigation")).toBeInTheDocument();
  });
});
