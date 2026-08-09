-- Add default-collection flag and collection-scoped vocabulary words.

ALTER TABLE "word_collections"
ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "vocab_words"
DROP COLUMN IF EXISTS "collection_id";

ALTER TABLE "vocab_words"
ADD COLUMN "collection_id" TEXT;

INSERT INTO "word_collections" (
  "id",
  "owner_user_id",
  "name",
  "kind",
  "is_default",
  "is_public",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  "users"."id",
  'My Vocabulary',
  'USER',
  true,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "users"
WHERE NOT EXISTS (
  SELECT 1
  FROM "word_collections" AS "existing"
  WHERE "existing"."owner_user_id" = "users"."id"
    AND "existing"."is_default" = true
);

UPDATE "vocab_words" AS "word"
SET "collection_id" = "collection"."id"
FROM "word_collections" AS "collection"
WHERE "collection"."owner_user_id" = "word"."user_id"
  AND "collection"."is_default" = true
  AND "word"."collection_id" IS NULL;

ALTER TABLE "vocab_words"
ALTER COLUMN "collection_id" SET NOT NULL;

DROP INDEX IF EXISTS "vocab_words_user_id_normalized_word_key";

CREATE UNIQUE INDEX "vocab_words_collection_id_normalized_word_key"
ON "vocab_words"("collection_id", "normalized_word");

ALTER TABLE "vocab_words"
DROP CONSTRAINT IF EXISTS "vocab_words_collection_id_fkey";

ALTER TABLE "vocab_words"
ADD CONSTRAINT "vocab_words_collection_id_fkey"
FOREIGN KEY ("collection_id") REFERENCES "word_collections"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "vocab_words_collection_id_idx"
ON "vocab_words"("collection_id");

CREATE INDEX IF NOT EXISTS "vocab_words_user_id_collection_id_idx"
ON "vocab_words"("user_id", "collection_id");

CREATE UNIQUE INDEX IF NOT EXISTS "word_collections_one_default_per_user"
ON "word_collections"("owner_user_id")
WHERE "is_default" = true AND "owner_user_id" IS NOT NULL;

DROP TABLE IF EXISTS "collection_user_word_items";
