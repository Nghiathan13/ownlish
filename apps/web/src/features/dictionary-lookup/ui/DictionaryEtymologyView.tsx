import type { DictionaryEtymology } from "@/entities/dictionary";
import { useT } from "@/shared/lib/providers";
import { DictionaryDefinitionView } from "./DictionaryDefinitionView";
import { DictionaryTerms } from "./DictionaryTerms";

type DictionaryEtymologyViewProps = {
  etymology: DictionaryEtymology;
  index: number;
};

export function DictionaryEtymologyView({
  etymology,
  index,
}: DictionaryEtymologyViewProps) {
  const t = useT();
  const phonetics = [
    etymology.phonetics.us?.ipa
      ? { label: t("dictionary.us"), ipa: etymology.phonetics.us.ipa }
      : null,
    etymology.phonetics.uk?.ipa
      ? { label: t("dictionary.uk"), ipa: etymology.phonetics.uk.ipa }
      : null,
  ].filter((phonetic): phonetic is { label: string; ipa: string } => phonetic !== null);

  return (
    <section className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-foreground">
        {t("dictionary.etymology")} {index + 1}
      </h3>
      {etymology.etymology ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{etymology.etymology}</p>
      ) : null}
      {phonetics.length > 0 ? (
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {phonetics.map((phonetic) => (
            <div className="flex gap-1.5" key={phonetic.label}>
              <dt className="text-muted-foreground">{phonetic.label}</dt>
              <dd className="font-medium text-foreground">{phonetic.ipa}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-3">
        <DictionaryTerms items={etymology.homophones} label={t("dictionary.homophones")} />
      </div>
      <div className="mt-4 grid gap-4">
        {etymology.parts_of_speech.map((partOfSpeech, partIndex) => (
          <section key={`${partOfSpeech.part_of_speech}-${partIndex}`}>
            <h4 className="text-sm font-semibold text-primary">{partOfSpeech.part_of_speech}</h4>
            <ol className="mt-2 grid gap-4">
              {partOfSpeech.definitions.map((definition, definitionIndex) => (
                <DictionaryDefinitionView
                  definition={definition}
                  depth={0}
                  key={`${definition.definition_en}-${definitionIndex}`}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
