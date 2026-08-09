DROP TABLE "user_word_progress";

CREATE TABLE "user_definition_progress" (
    "user_id" TEXT NOT NULL,
    "catalog_definition_id" TEXT NOT NULL,
    "level" SMALLINT NOT NULL DEFAULT 0,
    "next_review_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_definition_progress_pkey" PRIMARY KEY ("user_id", "catalog_definition_id"),
    CONSTRAINT "user_definition_progress_level_check" CHECK ("level" BETWEEN 0 AND 4)
);

ALTER TABLE "user_definition_progress"
    ADD CONSTRAINT "user_definition_progress_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_definition_progress"
    ADD CONSTRAINT "user_definition_progress_catalog_definition_id_fkey"
    FOREIGN KEY ("catalog_definition_id") REFERENCES "catalog_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "user_definition_progress_user_id_next_review_at_idx"
    ON "user_definition_progress"("user_id", "next_review_at")
    WHERE "level" < 4;

ALTER TABLE "user_definition_progress" ENABLE ROW LEVEL SECURITY;
