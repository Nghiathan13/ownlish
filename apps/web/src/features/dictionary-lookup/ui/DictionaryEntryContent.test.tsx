import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DictionaryEntry } from "@/entities/dictionary";
import { LocaleProvider } from "@/shared/lib/providers";
import { DictionaryEntryContent } from "./DictionaryEntryContent";

const entry: DictionaryEntry = {
  word: "a",
  etymologies: [
    {
      etymology: "From Latin a.",
      phonetics: {
        us: { ipa: "/eɪ/", audio: "en-us-a.ogg" },
        uk: { ipa: "/eɪ/", audio: "" },
      },
      homophones: ["eh"],
      parts_of_speech: [
        {
          part_of_speech: "Article",
          definitions: [
            {
              definition_en: "An indefinite article.",
              definition_vi: "Một mạo từ không xác định.",
              meaning: "một",
              labels: ["grammar"],
              synonyms: ["one"],
              antonyms: ["the"],
              examples: [
                {
                  example_en: "There was **a** man here.",
                  example_vi: "Có một người đàn ông ở đây.",
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
            },
          ],
        },
      ],
    },
  ],
};

describe("DictionaryEntryContent", () => {
  it("renders all entry fields, including recursive sub-definitions", () => {
    render(
      <LocaleProvider>
        <DictionaryEntryContent entry={entry} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Etymology 1")).toBeInTheDocument();
    expect(screen.getAllByText("/eɪ/")).toHaveLength(2);
    expect(screen.getByText("Homophones:", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Article")).toBeInTheDocument();
    expect(screen.getByText("An indefinite article.")).toBeInTheDocument();
    expect(screen.getByText("Có một người đàn ông ở đây.")).toBeInTheDocument();
    expect(screen.getByText("Used before a numeral.")).toBeInTheDocument();
  });

  it("omits empty optional content without hiding its etymology or part of speech", () => {
    const sparseEntry: DictionaryEntry = {
      word: "a",
      etymologies: [
        {
          etymology: "",
          phonetics: {},
          homophones: [],
          parts_of_speech: [
            {
              part_of_speech: "Article",
              definitions: [
                {
                  definition_en: "",
                  definition_vi: "",
                  meaning: "",
                  labels: [],
                  synonyms: [],
                  antonyms: [],
                  examples: [],
                  sub_definitions: [],
                },
              ],
            },
          ],
        },
      ],
    };

    render(
      <LocaleProvider>
        <DictionaryEntryContent entry={sparseEntry} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Etymology 1")).toBeInTheDocument();
    expect(screen.getByText("Article")).toBeInTheDocument();
    expect(screen.queryByText("US")).not.toBeInTheDocument();
    expect(screen.queryByText("Homophones:", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText("Labels:", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText("Examples")).not.toBeInTheDocument();
  });
});
