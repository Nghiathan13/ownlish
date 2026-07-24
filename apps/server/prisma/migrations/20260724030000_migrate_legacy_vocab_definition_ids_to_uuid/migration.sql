UPDATE "vocab_word_definitions"
SET "id" = gen_random_uuid()::TEXT
WHERE "id" ~ '^[0-9a-f]{32}$';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "vocab_word_definitions"
    WHERE "id" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) THEN
    RAISE EXCEPTION 'vocab_word_definitions contains a non-UUID v4 id';
  END IF;
END $$;
