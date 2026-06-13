import type { VocabService } from '../vocab.service';

type ActiveVocabWord = NonNullable<Awaited<ReturnType<VocabService['get']>>>;

export type DeleteVocabDefinitionResponse =
  | {
      deletedDefinitionId: string;
      vocabWordId: string;
      wordRemoved: false;
      word: ActiveVocabWord;
    }
  | {
      deletedDefinitionId: string;
      vocabWordId: string;
      wordRemoved: true;
    };
