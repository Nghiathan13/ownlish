ALTER TABLE "public"."users"
ADD COLUMN "refresh_token_hash" TEXT,
ADD COLUMN "refresh_token_expires_at" TIMESTAMP(3);
