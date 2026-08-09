CREATE TABLE "system_vocabulary_entries" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "normalized_word" TEXT NOT NULL,
    "source_definition_id" INTEGER NOT NULL,
    "source_word_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "meaning_vi" TEXT,
    "definition" TEXT,
    "example" TEXT,
    "example_vi" TEXT,
    "ipa_uk" TEXT,
    "ipa_us" TEXT,
    "band" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_vocabulary_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "system_vocabulary_entries_source_source_definition_id_key"
    ON "system_vocabulary_entries"("source", "source_definition_id");

CREATE INDEX "system_vocabulary_entries_band_sort_order_idx"
    ON "system_vocabulary_entries"("band", "sort_order");

ALTER TABLE "system_vocabulary_entries" ENABLE ROW LEVEL SECURITY;

WITH legacy_entries AS (
    SELECT DISTINCT ON (definition.id)
        definition.id,
        word.word,
        word.normalized_word,
        definition.source_definition_id,
        definition.source_word_id,
        definition.type,
        definition.meaning_vi,
        definition.definition,
        definition.example,
        definition.example_vi,
        definition.ipa_uk,
        definition.ipa_us,
        COALESCE(definition.band, collection.cefr_level) AS band,
        definition.source,
        definition.created_at,
        definition.updated_at,
        item.sort_order AS legacy_sort_order
    FROM "collection_catalog_items" AS item
    JOIN "word_collections" AS collection ON collection.id = item.collection_id
    JOIN "catalog_words" AS word ON word.id = item.catalog_word_id
    JOIN "catalog_definitions" AS definition ON definition.catalog_word_id = word.id
    WHERE collection.kind = 'SYSTEM'
      AND collection.is_public = TRUE
      AND definition.band IS NOT NULL
    ORDER BY definition.id, item.sort_order
), ranked_entries AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY band
            ORDER BY legacy_sort_order, word, source, type, id
        )::INTEGER AS sort_order
    FROM legacy_entries
)
INSERT INTO "system_vocabulary_entries" (
    "id", "word", "normalized_word", "source_definition_id", "source_word_id",
    "type", "meaning_vi", "definition", "example", "example_vi", "ipa_uk", "ipa_us",
    "band", "source", "sort_order", "created_at", "updated_at"
)
SELECT
    "id", "word", "normalized_word", "source_definition_id", "source_word_id",
    "type", "meaning_vi", "definition", "example", "example_vi", "ipa_uk", "ipa_us",
    "band", "source", "sort_order", "created_at", "updated_at"
FROM ranked_entries;

ALTER TABLE "user_definition_progress"
    DROP CONSTRAINT "user_definition_progress_catalog_definition_id_fkey";

ALTER TABLE "user_definition_progress"
    RENAME COLUMN "catalog_definition_id" TO "system_entry_id";

ALTER TABLE "user_definition_progress"
    RENAME CONSTRAINT "user_definition_progress_pkey" TO "user_definition_progress_user_id_system_entry_id_pkey";

ALTER TABLE "user_definition_progress"
    ADD CONSTRAINT "user_definition_progress_system_entry_id_fkey"
    FOREIGN KEY ("system_entry_id") REFERENCES "system_vocabulary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
