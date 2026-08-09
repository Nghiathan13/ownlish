CREATE TABLE "public"."refresh_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

INSERT INTO "public"."refresh_sessions" (
    "id",
    "user_id",
    "token_hash",
    "expires_at",
    "created_at",
    "updated_at"
)
SELECT
    md5(random()::text || clock_timestamp()::text || "id"),
    "id",
    "refresh_token_hash",
    "refresh_token_expires_at",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."users"
WHERE "refresh_token_hash" IS NOT NULL
  AND "refresh_token_expires_at" IS NOT NULL;

DROP INDEX IF EXISTS "public"."users_refresh_token_hash_key";

ALTER TABLE "public"."users"
DROP COLUMN IF EXISTS "refresh_token_hash",
DROP COLUMN IF EXISTS "refresh_token_expires_at";

CREATE UNIQUE INDEX "refresh_sessions_token_hash_key"
ON "public"."refresh_sessions"("token_hash");

CREATE INDEX "refresh_sessions_user_id_idx"
ON "public"."refresh_sessions"("user_id");

CREATE INDEX "refresh_sessions_user_id_revoked_at_idx"
ON "public"."refresh_sessions"("user_id", "revoked_at");

CREATE INDEX "refresh_sessions_expires_at_idx"
ON "public"."refresh_sessions"("expires_at");

CREATE INDEX "vocab_words_user_id_deleted_at_level_next_review_idx"
ON "public"."vocab_words"("user_id", "deleted_at", "level", "next_review");

ALTER TABLE "public"."refresh_sessions"
ADD CONSTRAINT "refresh_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
