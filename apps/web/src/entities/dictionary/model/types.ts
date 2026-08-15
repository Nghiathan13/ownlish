export type DictionaryExample = {
  example_en: string;
  example_vi: string;
};

export type DictionaryDefinition = {
  definition_en: string;
  definition_vi: string;
  meaning: string;
  labels: string[];
  synonyms: string[];
  antonyms: string[];
  examples: DictionaryExample[];
  sub_definitions: DictionaryDefinition[];
};

export type DictionaryPartOfSpeech = {
  part_of_speech: string;
  definitions: DictionaryDefinition[];
};

export type DictionaryPhonetic = {
  ipa: string;
  audio: string;
};

export type DictionaryEtymology = {
  etymology: string;
  phonetics: {
    us?: DictionaryPhonetic;
    uk?: DictionaryPhonetic;
  };
  homophones: string[];
  parts_of_speech: DictionaryPartOfSpeech[];
};

export type DictionaryEntry = {
  word: string;
  etymologies: DictionaryEtymology[];
};
