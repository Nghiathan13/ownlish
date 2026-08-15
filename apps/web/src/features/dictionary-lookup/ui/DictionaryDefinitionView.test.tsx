import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DictionaryDefinition } from "@/entities/dictionary";
import { LocaleProvider } from "@/shared/lib/providers";
import { DictionaryDefinitionView } from "./DictionaryDefinitionView";

const definition: DictionaryDefinition = {
  definition_en: "An indefinite article.",
  definition_vi: "Một mạo từ không xác định.",
  meaning: "một",
  labels: ["grammar"],
  synonyms: ["one"],
  antonyms: ["the"],
  examples: [
    {
      example_en: "There was a man here.",
      example_vi: "Có một người ở đây.",
    },
  ],
  sub_definitions: [
    {
      definition_en: "Used before a numeral.",
      definition_vi: "Dùng trước một chữ số.",
      meaning: "một",
      labels: [],
      synonyms: [],
      antonyms: [],
      examples: [],
      sub_definitions: [],
    },
  ],
};

describe("DictionaryDefinitionView", () => {
  it("renders definition details, examples, terms, and recursive sub-definitions", () => {
    render(
      <LocaleProvider>
        <ol>
          <DictionaryDefinitionView definition={definition} depth={0} />
        </ol>
      </LocaleProvider>,
    );

    expect(screen.getByText(definition.definition_en)).toBeInTheDocument();
    expect(screen.getByText(definition.definition_vi)).toBeInTheDocument();
    expect(screen.getByText("grammar").parentElement).toHaveTextContent("Labels: grammar");
    expect(screen.getByText("There was a man here.")).toBeInTheDocument();
    expect(screen.getByText("Used before a numeral.")).toBeInTheDocument();
  });

  it("omits optional groups that have no content", () => {
    const emptyDefinition: DictionaryDefinition = {
      definition_en: "",
      definition_vi: "",
      meaning: "",
      labels: [],
      synonyms: [],
      antonyms: [],
      examples: [],
      sub_definitions: [],
    };
    const { container } = render(
      <LocaleProvider>
        <ol>
          <DictionaryDefinitionView definition={emptyDefinition} depth={1} />
        </ol>
      </LocaleProvider>,
    );

    expect(container.querySelector("li")).toHaveClass("border-l");
    expect(screen.queryByText("Examples")).not.toBeInTheDocument();
    expect(screen.queryByText("Labels:", { exact: false })).not.toBeInTheDocument();
  });
});
