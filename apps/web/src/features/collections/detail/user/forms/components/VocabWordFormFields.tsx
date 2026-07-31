"use client";

import { useState } from "react";
import { VOCAB_WORD_FORM_LIMITS } from "@/features/collections/detail/user/forms/constants/vocabWordFormLimits";
import type { VocabWordFormValues } from "@/features/collections/detail/user/forms/lib/vocabWordForm";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { Field } from "@/shared/ui/Field";
import { DownIcon } from "@/shared/ui/icons/DownIcon";
import { UpIcon } from "@/shared/ui/icons/UpIcon";
import { TextInput } from "@/shared/ui/TextInput";
import { Textarea } from "@/shared/ui/Textarea";

const CEFR_BANDS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

type VocabWordFormFieldsProps = {
  disabled?: boolean;
  disableWordField?: boolean;
  onChange: (field: keyof VocabWordFormValues, value: string) => void;
  values: VocabWordFormValues;
};

export function VocabWordFormFields({
  disabled = false,
  disableWordField = false,
  onChange,
  values,
}: VocabWordFormFieldsProps) {
  const t = useT();
  const [isMoreDetailsOpen, setIsMoreDetailsOpen] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("wordsTable.word")}>
          <TextInput
            value={values.word}
            onChange={(event) => onChange("word", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.word}
            required
            disabled={disabled || disableWordField}
          />
        </Field>

        <Field label={t("wordsTable.meaningVi")}>
          <TextInput
            value={values.meaningVi}
            onChange={(event) => onChange("meaningVi", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.meaningVi}
            disabled={disabled}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("wordsTable.type")}>
          <TextInput
            value={values.type}
            onChange={(event) => onChange("type", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.type}
            placeholder={t("wordsTable.typePlaceholder")}
            disabled={disabled}
          />
        </Field>

        <Field label={t("wordsTable.ipaUk")}>
          <TextInput
            value={values.ipaUk}
            onChange={(event) => onChange("ipaUk", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.ipaUk}
            placeholder="/wɜːd/"
            disabled={disabled}
          />
        </Field>

        <Field label={t("wordsTable.ipaUs")}>
          <TextInput
            value={values.ipaUs}
            onChange={(event) => onChange("ipaUs", event.target.value)}
            maxLength={VOCAB_WORD_FORM_LIMITS.ipaUs}
            placeholder="/wɝːd/"
            disabled={disabled}
          />
        </Field>
      </div>

      <details
        className="rounded-lg border border-border px-3 py-2"
        onToggle={(event) => setIsMoreDetailsOpen(event.currentTarget.open)}
        open={isMoreDetailsOpen}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-muted-foreground [&::-webkit-details-marker]:hidden">
          {t("wordsTable.moreDetails")}
          {isMoreDetailsOpen ? (
            <UpIcon className="ml-auto size-5 shrink-0" />
          ) : (
            <DownIcon className="ml-auto size-5 shrink-0" />
          )}
        </summary>
        <div className="mt-4 grid gap-4">
          <Field as="div" label={t("wordsTable.band")}>
            <div aria-label={t("wordsTable.band")} className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="group">
              {CEFR_BANDS.map((band) => {
                const isSelected = values.band === band;

                return (
                  <button
                    aria-pressed={isSelected}
                    className={classNames(
                      "h-10 cursor-pointer rounded-lg border text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] disabled:cursor-default",
                      isSelected
                        ? "border-foreground bg-muted text-foreground"
                        : "border-border bg-surface text-foreground dark:bg-[#000000]",
                    )}
                    disabled={disabled}
                    key={band}
                    onClick={() => onChange("band", isSelected ? "" : band)}
                    type="button"
                  >
                    {band}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label={t("wordsTable.definition")}>
            <Textarea
              value={values.definition}
              onChange={(event) => onChange("definition", event.target.value)}
              maxLength={VOCAB_WORD_FORM_LIMITS.definition}
              disabled={disabled}
            />
          </Field>

          <Field label={t("wordsTable.example")}>
            <Textarea
              value={values.example}
              onChange={(event) => onChange("example", event.target.value)}
              maxLength={VOCAB_WORD_FORM_LIMITS.example}
              disabled={disabled}
            />
          </Field>

          <Field label={t("wordsTable.exampleVi")}>
            <Textarea
              value={values.exampleVi}
              onChange={(event) => onChange("exampleVi", event.target.value)}
              maxLength={VOCAB_WORD_FORM_LIMITS.exampleVi}
              disabled={disabled}
            />
          </Field>
        </div>
      </details>
    </div>
  );
}
