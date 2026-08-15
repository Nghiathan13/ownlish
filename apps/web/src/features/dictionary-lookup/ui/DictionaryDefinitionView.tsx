import type { DictionaryDefinition } from "@/entities/dictionary";
import { useT } from "@/shared/lib/providers";
import { DictionaryTerms } from "./DictionaryTerms";

type DictionaryDefinitionViewProps = {
  definition: DictionaryDefinition;
  depth: number;
};

export function DictionaryDefinitionView({
  definition,
  depth,
}: DictionaryDefinitionViewProps) {
  const t = useT();

  return (
    <li className={depth > 0 ? "mt-3 border-l border-border pl-3" : ""}>
      {definition.definition_en ? (
        <p className="text-sm text-foreground">{definition.definition_en}</p>
      ) : null}
      {definition.definition_vi ? (
        <p className="mt-1 text-sm text-muted-foreground">{definition.definition_vi}</p>
      ) : null}
      {definition.meaning ? (
        <p className="mt-2 font-medium text-foreground">{definition.meaning}</p>
      ) : null}
      <div className="mt-2 grid gap-1">
        <DictionaryTerms items={definition.labels} label={t("dictionary.labels")} />
        <DictionaryTerms items={definition.synonyms} label={t("dictionary.synonyms")} />
        <DictionaryTerms items={definition.antonyms} label={t("dictionary.antonyms")} />
      </div>
      {definition.examples.length > 0 ? (
        <div className="mt-3 grid gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("dictionary.examples")}
          </p>
          {definition.examples.map((example, index) => (
            <blockquote
              className="border-l-2 border-primary pl-3 text-sm"
              key={`${example.example_en}-${index}`}
            >
              <p className="text-foreground">{example.example_en}</p>
              <p className="mt-1 text-muted-foreground">{example.example_vi}</p>
            </blockquote>
          ))}
        </div>
      ) : null}
      {definition.sub_definitions.length > 0 ? (
        <ol className="mt-3 grid gap-2">
          {definition.sub_definitions.map((subDefinition, index) => (
            <DictionaryDefinitionView
              definition={subDefinition}
              depth={depth + 1}
              key={`${subDefinition.definition_en}-${index}`}
            />
          ))}
        </ol>
      ) : null}
    </li>
  );
}
