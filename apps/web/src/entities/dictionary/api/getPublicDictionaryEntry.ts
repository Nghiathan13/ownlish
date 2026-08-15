import { DICTIONARY_ROOT } from "@/shared/config";
import { normalizeDictionaryLookup } from "../lib/normalizeDictionaryLookup";
import type {
  DictionaryDefinition,
  DictionaryEntry,
  DictionaryEtymology,
  DictionaryExample,
  DictionaryPartOfSpeech,
  DictionaryPhonetic,
} from "../model/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseExample(value: unknown): DictionaryExample {
  if (!isRecord(value) || typeof value.example_en !== "string" || typeof value.example_vi !== "string") {
    throw new Error("Invalid dictionary entry.");
  }

  return {
    example_en: value.example_en,
    example_vi: value.example_vi,
  };
}

function parseDefinition(value: unknown): DictionaryDefinition {
  if (
    !isRecord(value) ||
    typeof value.definition_en !== "string" ||
    typeof value.definition_vi !== "string" ||
    typeof value.meaning !== "string" ||
    !isStringArray(value.labels) ||
    !isStringArray(value.synonyms) ||
    !isStringArray(value.antonyms) ||
    !Array.isArray(value.examples) ||
    !Array.isArray(value.sub_definitions)
  ) {
    throw new Error("Invalid dictionary entry.");
  }

  return {
    definition_en: value.definition_en,
    definition_vi: value.definition_vi,
    meaning: value.meaning,
    labels: value.labels,
    synonyms: value.synonyms,
    antonyms: value.antonyms,
    examples: value.examples.map(parseExample),
    sub_definitions: value.sub_definitions.map(parseDefinition),
  };
}

function parsePartOfSpeech(value: unknown): DictionaryPartOfSpeech {
  if (
    !isRecord(value) ||
    typeof value.part_of_speech !== "string" ||
    !Array.isArray(value.definitions)
  ) {
    throw new Error("Invalid dictionary entry.");
  }

  return {
    part_of_speech: value.part_of_speech,
    definitions: value.definitions.map(parseDefinition),
  };
}

function parsePhonetic(value: unknown): DictionaryPhonetic {
  if (!isRecord(value) || typeof value.ipa !== "string" || typeof value.audio !== "string") {
    throw new Error("Invalid dictionary entry.");
  }

  return { ipa: value.ipa, audio: value.audio };
}

function parseEtymology(value: unknown): DictionaryEtymology {
  if (
    !isRecord(value) ||
    typeof value.etymology !== "string" ||
    !isRecord(value.phonetics) ||
    !isStringArray(value.homophones) ||
    !Array.isArray(value.parts_of_speech)
  ) {
    throw new Error("Invalid dictionary entry.");
  }

  const us = value.phonetics.us;
  const uk = value.phonetics.uk;

  return {
    etymology: value.etymology,
    phonetics: {
      ...(us === undefined ? {} : { us: parsePhonetic(us) }),
      ...(uk === undefined ? {} : { uk: parsePhonetic(uk) }),
    },
    homophones: value.homophones,
    parts_of_speech: value.parts_of_speech.map(parsePartOfSpeech),
  };
}

export function parsePublicDictionaryEntry(value: unknown): DictionaryEntry {
  if (!isRecord(value) || typeof value.word !== "string" || !Array.isArray(value.etymologies)) {
    throw new Error("Invalid dictionary entry.");
  }

  return {
    word: value.word,
    etymologies: value.etymologies.map(parseEtymology),
  };
}

function getDictionaryRootUrl() {
  if (!DICTIONARY_ROOT) {
    throw new Error("Dictionary is not configured.");
  }

  return new URL(DICTIONARY_ROOT.endsWith("/") ? DICTIONARY_ROOT : `${DICTIONARY_ROOT}/`);
}

export async function getPublicDictionaryEntry(
  word: string,
  options: { signal?: AbortSignal } = {},
): Promise<DictionaryEntry | null> {
  const normalizedWord = normalizeDictionaryLookup(word);

  if (!normalizedWord) {
    throw new Error("Invalid dictionary lookup word.");
  }

  const response = await fetch(
    new URL(`${encodeURIComponent(normalizedWord)}.json`, getDictionaryRootUrl()),
    {
      credentials: "omit",
      signal: options.signal,
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Cannot load dictionary entry.");
  }

  const entry = parsePublicDictionaryEntry(await response.json());

  if (entry.word !== normalizedWord) {
    throw new Error("Dictionary entry does not match its lookup word.");
  }

  return entry;
}
