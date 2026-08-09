-- Replace the global user/word unique constraint with a partial unique
-- index so a soft-deleted word can be added again later.
DROP INDEX "vocab_words_user_id_normalized_word_key";

CREATE UNIQUE INDEX "vocab_words_active_user_id_normalized_word_key"
ON "vocab_words"("user_id", "normalized_word")
WHERE "deleted_at" IS NULL;

CREATE INDEX "vocab_words_user_id_normalized_word_idx"
ON "vocab_words"("user_id", "normalized_word");
