CREATE INDEX "toeic_learning_runs_open_mock_selection_lookup_idx"
ON "toeic_learning_runs"("user_id", "test_key", "selected_parts", "created_at" DESC)
WHERE "scope" = 'TEST'
  AND "mode" = 'MOCK_TEST'
  AND "completed_at" IS NULL;
