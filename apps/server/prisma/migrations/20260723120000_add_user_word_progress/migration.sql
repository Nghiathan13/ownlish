CREATE TABLE "user_word_progress" (
    "user_id" TEXT NOT NULL,
    "catalog_word_id" TEXT NOT NULL,
    "level" SMALLINT NOT NULL DEFAULT 0,
    "next_review_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_word_progress_pkey" PRIMARY KEY ("user_id", "catalog_word_id"),
    CONSTRAINT "user_word_progress_level_check" CHECK ("level" BETWEEN 0 AND 4)
);

ALTER TABLE "user_word_progress"
    ADD CONSTRAINT "user_word_progress_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_word_progress"
    ADD CONSTRAINT "user_word_progress_catalog_word_id_fkey"
    FOREIGN KEY ("catalog_word_id") REFERENCES "catalog_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "user_word_progress_user_id_next_review_at_idx"
    ON "user_word_progress"("user_id", "next_review_at")
    WHERE "level" < 4;

CREATE INDEX "collection_catalog_items_collection_id_sort_order_idx"
    ON "collection_catalog_items"("collection_id", "sort_order");

ALTER TABLE "user_word_progress" ENABLE ROW LEVEL SECURITY;
