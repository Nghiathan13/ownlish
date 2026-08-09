CREATE TABLE "user_vocabulary_entries" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "collection_id" TEXT NOT NULL,
  "system_entry_id" TEXT,
  "word" TEXT NOT NULL,
  "normalized_word" TEXT NOT NULL,
  "type" TEXT,
  "meaning_vi" TEXT,
  "definition" TEXT,
  "example" TEXT,
  "example_vi" TEXT,
  "ipa_uk" TEXT,
  "ipa_us" TEXT,
  "band" TEXT,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "level" INTEGER NOT NULL DEFAULT 0,
  "wrong_count" INTEGER NOT NULL DEFAULT 0,
  "last_review" TIMESTAMP(3),
  "next_review" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_vocabulary_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_vocabulary_entries_level_check" CHECK ("level" BETWEEN 0 AND 7)
);

ALTER TABLE "user_vocabulary_entries" ENABLE ROW LEVEL SECURITY;

INSERT INTO "user_vocabulary_entries" (
  "id", "user_id", "collection_id", "system_entry_id", "word", "normalized_word",
  "type", "meaning_vi", "definition", "example", "example_vi", "ipa_uk", "ipa_us",
  "band", "source", "level", "wrong_count", "last_review", "next_review", "created_at", "updated_at"
)
SELECT
  definition."id", word."user_id", word."collection_id", system_entry."id", word."word", word."normalized_word",
  definition."type", definition."meaning_vi", definition."definition", definition."example", definition."example_vi",
  definition."ipa_uk", definition."ipa_us", definition."band", definition."source", definition."level",
  definition."wrong_count", definition."last_review", definition."next_review", definition."created_at", definition."updated_at"
FROM "vocab_word_definitions" AS definition
INNER JOIN "vocab_words" AS word ON word."id" = definition."vocab_word_id"
LEFT JOIN "system_vocabulary_entries" AS system_entry
  ON system_entry."source_definition_id" = definition."source_definition_id"
  AND system_entry."source" = definition."source"
WHERE definition."deleted_at" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "vocab_word_definitions" AS definition
    LEFT JOIN "system_vocabulary_entries" AS system_entry
      ON system_entry."source_definition_id" = definition."source_definition_id"
      AND system_entry."source" = definition."source"
    WHERE definition."deleted_at" IS NULL
      AND definition."source_definition_id" IS NOT NULL
      AND system_entry."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot migrate imported vocabulary definitions without a matching system entry.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "system_vocabulary_entries" AS entry
    JOIN "system_vocabulary_entries" AS existing
      ON existing."id" = SUBSTRING(entry."id" FROM 4)
      AND existing."id" NOT LIKE 'cd-%'
    WHERE entry."id" LIKE 'cd-%'
  ) THEN
    RAISE EXCEPTION 'Cannot remove cd- prefix because a target system entry id already exists.';
  END IF;
END $$;

ALTER TABLE "user_vocabulary_entries"
  ADD CONSTRAINT "user_vocabulary_entries_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_vocabulary_entries_collection_id_fkey"
  FOREIGN KEY ("collection_id") REFERENCES "word_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_vocabulary_entries_system_entry_id_fkey"
  FOREIGN KEY ("system_entry_id") REFERENCES "system_vocabulary_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_definition_progress"
  DROP CONSTRAINT "user_definition_progress_level_check",
  ADD COLUMN "wrong_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "last_review_at" TIMESTAMPTZ,
  ALTER COLUMN "next_review_at" DROP NOT NULL,
  ADD CONSTRAINT "user_definition_progress_level_check" CHECK ("level" BETWEEN 0 AND 7);

ALTER TABLE "user_definition_progress"
  RENAME TO "user_system_vocabulary_progress";

DROP INDEX "user_definition_progress_user_id_next_review_at_idx";

UPDATE "system_vocabulary_entries"
SET "id" = SUBSTRING("id" FROM 4)
WHERE "id" LIKE 'cd-%';

ALTER TABLE "system_vocabulary_entries"
  DROP COLUMN "source_definition_id";

DROP TABLE "vocab_word_definitions";
DROP TABLE "vocab_words";

CREATE UNIQUE INDEX "user_vocabulary_entries_collection_id_system_entry_id_key"
  ON "user_vocabulary_entries"("collection_id", "system_entry_id");
CREATE INDEX "user_vocabulary_entries_user_id_collection_id_next_review_idx"
  ON "user_vocabulary_entries"("user_id", "collection_id", "next_review");
CREATE INDEX "user_vocabulary_entries_collection_id_normalized_word_idx"
  ON "user_vocabulary_entries"("collection_id", "normalized_word");
CREATE INDEX "user_vocabulary_entries_system_entry_id_idx"
  ON "user_vocabulary_entries"("system_entry_id");
CREATE INDEX "user_system_vocabulary_progress_user_id_next_review_at_idx"
  ON "user_system_vocabulary_progress"("user_id", "next_review_at");
