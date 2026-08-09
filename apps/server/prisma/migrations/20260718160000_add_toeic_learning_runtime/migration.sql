CREATE TYPE "ToeicLearningScope" AS ENUM ('TEST', 'PART_PRACTICE');

CREATE TABLE "toeic_learning_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scope" "ToeicLearningScope" NOT NULL,
    "test_key" TEXT,
    "part_number" INTEGER,
    "mode" "ToeicRunMode" NOT NULL DEFAULT 'PRACTICE',
    "selected_parts" INTEGER[] NOT NULL,
    "total_right" INTEGER NOT NULL DEFAULT 0,
    "total_wrong" INTEGER NOT NULL DEFAULT 0,
    "finish_requested_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "toeic_learning_runs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "toeic_learning_runs_scope_shape_check" CHECK (
      ("scope" = 'TEST' AND "test_key" IS NOT NULL AND "part_number" IS NULL)
      OR
      ("scope" = 'PART_PRACTICE' AND "test_key" IS NULL AND "part_number" BETWEEN 1 AND 7 AND "selected_parts" = ARRAY["part_number"])
    ),
    CONSTRAINT "toeic_learning_runs_mock_scope_check" CHECK (
      "mode" <> 'MOCK_TEST' OR "scope" = 'TEST'
    ),
    CONSTRAINT "toeic_learning_runs_selected_parts_check" CHECK (
      cardinality("selected_parts") > 0
    )
);

CREATE TABLE "toeic_learning_run_answers" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "question_key" TEXT NOT NULL,
    "selected_key" TEXT NOT NULL,
    "status" "ToeicRunQuestionStatus" NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL,
    "graded_at" TIMESTAMP(3),
    CONSTRAINT "toeic_learning_run_answers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "toeic_learning_runs_user_id_idx"
ON "toeic_learning_runs"("user_id");

CREATE INDEX "toeic_learning_runs_user_catalog_scope_created_at_idx"
ON "toeic_learning_runs"("user_id", "scope", "created_at");

CREATE INDEX "toeic_learning_runs_finish_requested_completed_idx"
ON "toeic_learning_runs"("finish_requested_at", "completed_at");

CREATE UNIQUE INDEX "toeic_learning_runs_practice_test_key"
ON "toeic_learning_runs"("user_id", "test_key")
WHERE "scope" = 'TEST' AND "mode" = 'PRACTICE';

CREATE UNIQUE INDEX "toeic_learning_runs_practice_part_key"
ON "toeic_learning_runs"("user_id", "part_number")
WHERE "scope" = 'PART_PRACTICE' AND "mode" = 'PRACTICE';

CREATE UNIQUE INDEX "toeic_learning_run_answers_run_id_question_key_key"
ON "toeic_learning_run_answers"("run_id", "question_key");

CREATE INDEX "toeic_learning_run_answers_run_id_status_idx"
ON "toeic_learning_run_answers"("run_id", "status");

ALTER TABLE "toeic_learning_runs"
ADD CONSTRAINT "toeic_learning_runs_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "toeic_learning_run_answers"
ADD CONSTRAINT "toeic_learning_run_answers_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "toeic_learning_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
