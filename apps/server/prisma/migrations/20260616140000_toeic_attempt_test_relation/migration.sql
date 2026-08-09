-- Add ToeicTest <-> ToeicTestAttempt relation
ALTER TABLE "toeic_test_attempts"
ADD CONSTRAINT "toeic_test_attempts_toeic_test_id_fkey"
FOREIGN KEY ("toeic_test_id") REFERENCES "toeic_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "toeic_test_attempts_toeic_test_id_idx" ON "toeic_test_attempts"("toeic_test_id");
