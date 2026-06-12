CREATE TYPE "WordCollectionKind" AS ENUM ('SYSTEM', 'USER');

CREATE TABLE "catalog_words" (
  "id" TEXT NOT NULL,
  "word" TEXT NOT NULL,
  "normalized_word" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "catalog_words_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_definitions" (
  "id" TEXT NOT NULL,
  "catalog_word_id" TEXT NOT NULL,
  "source_definition_id" INTEGER NOT NULL,
  "source_word_id" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "meaning_vi" TEXT,
  "definition" TEXT,
  "example" TEXT,
  "example_vi" TEXT,
  "ipa_uk" TEXT,
  "ipa_us" TEXT,
  "band" TEXT,
  "source" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "catalog_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "word_collections" (
  "id" TEXT NOT NULL,
  "owner_user_id" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "kind" "WordCollectionKind" NOT NULL DEFAULT 'USER',
  "source" TEXT,
  "cefr_level" TEXT,
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "word_collections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collection_catalog_items" (
  "collection_id" TEXT NOT NULL,
  "catalog_word_id" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "collection_catalog_items_pkey" PRIMARY KEY ("collection_id", "catalog_word_id")
);

CREATE TABLE "collection_user_word_items" (
  "collection_id" TEXT NOT NULL,
  "vocab_word_id" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "collection_user_word_items_pkey" PRIMARY KEY ("collection_id", "vocab_word_id")
);

CREATE UNIQUE INDEX "catalog_words_normalized_word_key"
ON "catalog_words"("normalized_word");

CREATE INDEX "catalog_words_word_idx"
ON "catalog_words"("word");

CREATE UNIQUE INDEX "catalog_definitions_source_source_definition_id_key"
ON "catalog_definitions"("source", "source_definition_id");

CREATE INDEX "catalog_definitions_catalog_word_id_idx"
ON "catalog_definitions"("catalog_word_id");

CREATE INDEX "catalog_definitions_source_band_idx"
ON "catalog_definitions"("source", "band");

CREATE INDEX "word_collections_kind_idx"
ON "word_collections"("kind");

CREATE INDEX "word_collections_owner_user_id_idx"
ON "word_collections"("owner_user_id");

CREATE INDEX "word_collections_source_cefr_level_idx"
ON "word_collections"("source", "cefr_level");

CREATE UNIQUE INDEX "word_collections_system_source_cefr_level_key"
ON "word_collections"("source", "cefr_level")
WHERE "kind" = 'SYSTEM';

CREATE INDEX "collection_catalog_items_catalog_word_id_idx"
ON "collection_catalog_items"("catalog_word_id");

CREATE INDEX "collection_user_word_items_vocab_word_id_idx"
ON "collection_user_word_items"("vocab_word_id");

ALTER TABLE "catalog_definitions"
ADD CONSTRAINT "catalog_definitions_catalog_word_id_fkey"
FOREIGN KEY ("catalog_word_id") REFERENCES "catalog_words"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "word_collections"
ADD CONSTRAINT "word_collections_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_catalog_items"
ADD CONSTRAINT "collection_catalog_items_collection_id_fkey"
FOREIGN KEY ("collection_id") REFERENCES "word_collections"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_catalog_items"
ADD CONSTRAINT "collection_catalog_items_catalog_word_id_fkey"
FOREIGN KEY ("catalog_word_id") REFERENCES "catalog_words"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_user_word_items"
ADD CONSTRAINT "collection_user_word_items_collection_id_fkey"
FOREIGN KEY ("collection_id") REFERENCES "word_collections"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_user_word_items"
ADD CONSTRAINT "collection_user_word_items_vocab_word_id_fkey"
FOREIGN KEY ("vocab_word_id") REFERENCES "vocab_words"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
