CREATE TABLE "vocab_word_definitions" (
  "id" TEXT NOT NULL,
  "vocab_word_id" TEXT NOT NULL,
  "source_definition_id" INTEGER,
  "source_word_id" INTEGER,
  "type" TEXT,
  "meaning_vi" TEXT,
  "definition" TEXT,
  "example" TEXT,
  "example_vi" TEXT,
  "ipa_uk" TEXT,
  "ipa_us" TEXT,
  "band" TEXT,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "vocab_word_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vocab_word_definitions_vocab_word_id_source_source_definition_id_key"
ON "vocab_word_definitions"("vocab_word_id", "source", "source_definition_id");

CREATE INDEX "vocab_word_definitions_vocab_word_id_idx"
ON "vocab_word_definitions"("vocab_word_id");

CREATE INDEX "vocab_word_definitions_source_source_definition_id_idx"
ON "vocab_word_definitions"("source", "source_definition_id");

ALTER TABLE "vocab_word_definitions"
ADD CONSTRAINT "vocab_word_definitions_vocab_word_id_fkey"
FOREIGN KEY ("vocab_word_id") REFERENCES "vocab_words"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "vocab_word_definitions" (
  "id",
  "vocab_word_id",
  "type",
  "meaning_vi",
  "definition",
  "example",
  "ipa_uk",
  "band",
  "source",
  "created_at",
  "updated_at"
)
SELECT
  md5("id" || ':manual'),
  "id",
  "type",
  "meaning_vi",
  "definition",
  "example",
  "ipa",
  "band",
  'manual',
  "created_at",
  "updated_at"
FROM "vocab_words"
WHERE
  "type" IS NOT NULL OR
  "meaning_vi" IS NOT NULL OR
  "definition" IS NOT NULL OR
  "example" IS NOT NULL OR
  "ipa" IS NOT NULL OR
  "band" IS NOT NULL;
