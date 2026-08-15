import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DictionaryEtymology } from "@/entities/dictionary";
import { LocaleProvider } from "@/shared/lib/providers";
import { DictionaryEtymologyView } from "./DictionaryEtymologyView";

const etymology: DictionaryEtymology = {
  etymology: "From Latin a.",
  phonetics: {
    uk: { audio: "", ipa: "/eɪ/" },
    us: { audio: "en-us-a.ogg", ipa: "/eɪ/" },
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
          labels: [],
          synonyms: [],
          antonyms: [],
          examples: [],
          sub_definitions: [],
        },
      ],
    },
  ],
};

describe("DictionaryEtymologyView", () => {
  it("renders its index, available IPA variants, terms, and parts of speech", () => {
    render(
      <LocaleProvider>
        <DictionaryEtymologyView etymology={etymology} index={1} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Etymology 2")).toBeInTheDocument();
    expect(screen.getByText("From Latin a.")).toBeInTheDocument();
    expect(screen.getAllByText("/eɪ/")).toHaveLength(2);
    expect(screen.getByText("eh").parentElement).toHaveTextContent("Homophones: eh");
    expect(screen.getByText("Article")).toBeInTheDocument();
    expect(screen.getByText("An indefinite article.")).toBeInTheDocument();
  });

  it("keeps the structural heading when optional etymology fields are empty", () => {
    render(
      <LocaleProvider>
        <DictionaryEtymologyView
          etymology={{ ...etymology, etymology: "", homophones: [], phonetics: {} }}
          index={0}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("Etymology 1")).toBeInTheDocument();
    expect(screen.queryByText("US")).not.toBeInTheDocument();
    expect(screen.queryByText("Homophones:", { exact: false })).not.toBeInTheDocument();
  });
});
