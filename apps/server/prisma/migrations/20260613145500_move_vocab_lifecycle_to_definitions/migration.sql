ALTER TABLE "vocab_word_definitions"
ADD COLUMN "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "wrong_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "last_review" TIMESTAMP(3),
ADD COLUMN "next_review" TIMESTAMP(3),
ADD COLUMN "deleted_at" TIMESTAMP(3);

UPDATE "vocab_word_definitions" AS "definition"
SET
  "level" = "word"."level",
  "wrong_count" = "word"."wrong_count",
  "last_review" = "word"."last_review",
  "next_review" = "word"."next_review",
  "deleted_at" = "word"."deleted_at"
FROM "vocab_words" AS "word"
WHERE "definition"."vocab_word_id" = "word"."id";

INSERT INTO "vocab_word_definitions" (
  "id",
  "vocab_word_id",
  "source",
  "level",
  "wrong_count",
  "last_review",
  "next_review",
  "created_at",
  "updated_at",
  "deleted_at"
)
SELECT
  md5("word"."id" || ':manual-empty'),
  "word"."id",
  'manual',
  "word"."level",
  "word"."wrong_count",
  "word"."last_review",
  "word"."next_review",
  "word"."created_at",
  "word"."updated_at",
  "word"."deleted_at"
FROM "vocab_words" AS "word"
WHERE NOT EXISTS (
  SELECT 1
  FROM "vocab_word_definitions" AS "definition"
  WHERE "definition"."vocab_word_id" = "word"."id"
);

WITH ranked_words AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "user_id", "normalized_word"
      ORDER BY "id"
    ) AS "canonical_id"
  FROM "vocab_words"
), word_moves AS (
  SELECT "id", "canonical_id"
  FROM ranked_words
  WHERE "id" <> "canonical_id"
)
DELETE FROM "vocab_word_definitions" AS "definition"
USING word_moves AS "move"
WHERE "definition"."vocab_word_id" = "move"."id"
  AND "definition"."source_definition_id" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "vocab_word_definitions" AS "existing"
    WHERE "existing"."vocab_word_id" = "move"."canonical_id"
      AND "existing"."source" = "definition"."source"
      AND "existing"."source_definition_id" = "definition"."source_definition_id"
  );

WITH ranked_words AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "user_id", "normalized_word"
      ORDER BY "id"
    ) AS "canonical_id"
  FROM "vocab_words"
), word_moves AS (
  SELECT "id", "canonical_id"
  FROM ranked_words
  WHERE "id" <> "canonical_id"
)
UPDATE "vocab_word_definitions" AS "definition"
SET "vocab_word_id" = "move"."canonical_id"
FROM word_moves AS "move"
WHERE "definition"."vocab_word_id" = "move"."id";

WITH ranked_words AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "user_id", "normalized_word"
      ORDER BY "id"
    ) AS "canonical_id"
  FROM "vocab_words"
), word_moves AS (
  SELECT "id", "canonical_id"
  FROM ranked_words
  WHERE "id" <> "canonical_id"
)
DELETE FROM "collection_user_word_items" AS "item"
USING word_moves AS "move"
WHERE "item"."vocab_word_id" = "move"."id"
  AND EXISTS (
    SELECT 1
    FROM "collection_user_word_items" AS "existing"
    WHERE "existing"."collection_id" = "item"."collection_id"
      AND "existing"."vocab_word_id" = "move"."canonical_id"
  );

WITH ranked_words AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "user_id", "normalized_word"
      ORDER BY "id"
    ) AS "canonical_id"
  FROM "vocab_words"
), word_moves AS (
  SELECT "id", "canonical_id"
  FROM ranked_words
  WHERE "id" <> "canonical_id"
)
UPDATE "collection_user_word_items" AS "item"
SET "vocab_word_id" = "move"."canonical_id"
FROM word_moves AS "move"
WHERE "item"."vocab_word_id" = "move"."id";

WITH ranked_words AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "user_id", "normalized_word"
      ORDER BY "id"
    ) AS "canonical_id"
  FROM "vocab_words"
), word_moves AS (
  SELECT "id"
  FROM ranked_words
  WHERE "id" <> "canonical_id"
)
DELETE FROM "vocab_words" AS "word"
USING word_moves AS "move"
WHERE "word"."id" = "move"."id";

DROP INDEX IF EXISTS "vocab_words_active_user_id_normalized_word_key";
DROP INDEX IF EXISTS "vocab_words_user_id_deleted_at_idx";
DROP INDEX IF EXISTS "vocab_words_user_id_deleted_at_level_next_review_idx";
DROP INDEX IF EXISTS "vocab_words_user_id_normalized_word_idx";

CREATE UNIQUE INDEX "vocab_words_user_id_normalized_word_key"
ON "vocab_words"("user_id", "normalized_word");

CREATE INDEX "vocab_word_definitions_vocab_word_id_deleted_at_idx"
ON "vocab_word_definitions"("vocab_word_id", "deleted_at");

CREATE INDEX "vocab_word_definitions_deleted_at_level_next_review_idx"
ON "vocab_word_definitions"("deleted_at", "level", "next_review");

ALTER TABLE "vocab_words"
DROP COLUMN "ipa",
DROP COLUMN "type",
DROP COLUMN "meaning_vi",
DROP COLUMN "definition",
DROP COLUMN "example",
DROP COLUMN "band",
DROP COLUMN "level",
DROP COLUMN "wrong_count",
DROP COLUMN "last_review",
DROP COLUMN "next_review",
DROP COLUMN "created_at",
DROP COLUMN "updated_at",
DROP COLUMN "deleted_at";
