import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dictionaryRoot = vi.hoisted(() => ({ value: "https://content.example/dictionary" }));

vi.mock("@/shared/config", () => ({
  get DICTIONARY_ROOT() {
    return dictionaryRoot.value;
  },
}));

import {
  getPublicDictionaryEntry,
  parsePublicDictionaryEntry,
} from "./getPublicDictionaryEntry";

const entry = {
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
              synonyms: [],
              antonyms: [],
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

function jsonResponse(value: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(value),
  } as Response;
}

describe("public dictionary entry API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    dictionaryRoot.value = "https://content.example/dictionary";
  });

  afterEach(() => vi.unstubAllGlobals());

  it("parses the complete recursive dictionary entry structure", () => {
    expect(parsePublicDictionaryEntry(entry)).toEqual(entry);
  });

  it("rejects malformed nested definitions", () => {
    expect(() =>
      parsePublicDictionaryEntry({
        ...entry,
        etymologies: [
          {
            ...entry.etymologies[0],
            parts_of_speech: [
              {
                ...entry.etymologies[0].parts_of_speech[0],
                definitions: [{ ...entry.etymologies[0].parts_of_speech[0].definitions[0], examples: [{}] }],
              },
            ],
          },
        ],
      }),
    ).toThrow("Invalid dictionary entry.");
  });

  it.each([
    [
      "a non-string definition label",
      {
        ...entry,
        etymologies: [
          {
            ...entry.etymologies[0],
            parts_of_speech: [
              {
                ...entry.etymologies[0].parts_of_speech[0],
                definitions: [
                  {
                    ...entry.etymologies[0].parts_of_speech[0].definitions[0],
                    labels: ["grammar", 1],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    [
      "an invalid part of speech",
      {
        ...entry,
        etymologies: [
          {
            ...entry.etymologies[0],
            parts_of_speech: [{ ...entry.etymologies[0].parts_of_speech[0], part_of_speech: 1 }],
          },
        ],
      },
    ],
    [
      "an invalid optional phonetic",
      {
        ...entry,
        etymologies: [
          {
            ...entry.etymologies[0],
            phonetics: { us: { ipa: 1, audio: "" } },
          },
        ],
      },
    ],
    [
      "a non-string homophone",
      {
        ...entry,
        etymologies: [{ ...entry.etymologies[0], homophones: ["eh", 1] }],
      },
    ],
    ["a non-string word", { ...entry, word: 1 }],
  ])("rejects %s", (_description, malformedEntry) => {
    expect(() => parsePublicDictionaryEntry(malformedEntry)).toThrow(
      "Invalid dictionary entry.",
    );
  });

  it("allows etymologies that omit both optional phonetics", () => {
    const parsed = parsePublicDictionaryEntry({
      ...entry,
      etymologies: [{ ...entry.etymologies[0], phonetics: {} }],
    });

    expect(parsed.etymologies[0].phonetics).toEqual({});
  });

  it("loads the normalized entry without credentials", async () => {
    const signal = new AbortController().signal;
    vi.mocked(fetch).mockResolvedValue(jsonResponse(entry));

    await expect(getPublicDictionaryEntry("A", { signal })).resolves.toEqual(entry);
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://content.example/dictionary/a.json"),
      { credentials: "omit", signal },
    );
  });

  it("preserves a configured trailing slash and rejects invalid lookup tokens", async () => {
    dictionaryRoot.value = "https://content.example/dictionary/";
    vi.mocked(fetch).mockResolvedValue(jsonResponse(entry));

    await expect(getPublicDictionaryEntry("a")).resolves.toEqual(entry);
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://content.example/dictionary/a.json"),
      { credentials: "omit", signal: undefined },
    );

    await expect(getPublicDictionaryEntry("a.")).rejects.toThrow(
      "Invalid dictionary lookup word.",
    );
  });

  it("maps 404 to a cached-friendly null result and rejects other failures", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 404));
    await expect(getPublicDictionaryEntry("a")).resolves.toBeNull();

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 503));
    await expect(getPublicDictionaryEntry("a")).rejects.toThrow(
      "Cannot load dictionary entry.",
    );
  });

  it("requires a configured root and checks the entry word", async () => {
    dictionaryRoot.value = "";
    await expect(getPublicDictionaryEntry("a")).rejects.toThrow(
      "Dictionary is not configured.",
    );
    expect(fetch).not.toHaveBeenCalled();

    dictionaryRoot.value = "https://content.example/dictionary";
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ...entry, word: "b" }));
    await expect(getPublicDictionaryEntry("a")).rejects.toThrow(
      "Dictionary entry does not match its lookup word.",
    );

    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ...entry, word: "A" }));
    await expect(getPublicDictionaryEntry("a")).rejects.toThrow(
      "Dictionary entry does not match its lookup word.",
    );
  });
});
