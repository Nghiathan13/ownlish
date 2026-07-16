CREATE UNIQUE INDEX "toeic_runs_practice_user_test_key"
ON "toeic_runs"("user_id", "toeic_test_id")
WHERE "mode" = 'PRACTICE';
