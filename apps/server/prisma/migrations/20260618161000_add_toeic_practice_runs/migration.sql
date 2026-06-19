-- CreateEnum
CREATE TYPE "ToeicPracticeRunMode" AS ENUM ('PRACTICE', 'WRONG_REVIEW');

-- CreateEnum
CREATE TYPE "ToeicPracticeRunQuestionStatus" AS ENUM ('UNANSWERED', 'SELECTED', 'CORRECT', 'WRONG');

-- CreateTable
CREATE TABLE "toeic_practice_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "toeic_test_id" INTEGER NOT NULL,
    "mode" "ToeicPracticeRunMode" NOT NULL DEFAULT 'PRACTICE',
    "selected_parts" INTEGER[] NOT NULL,
    "current_question_index" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "total_correct" INTEGER NOT NULL DEFAULT 0,
    "total_wrong" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_practice_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_practice_run_questions" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "toeic_question_id" INTEGER NOT NULL,
    "part_number" INTEGER NOT NULL,
    "question_number" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "selected_key" TEXT,
    "status" "ToeicPracticeRunQuestionStatus" NOT NULL DEFAULT 'UNANSWERED',
    "answered_at" TIMESTAMP(3),
    "graded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_practice_run_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "toeic_practice_runs_user_id_idx" ON "toeic_practice_runs"("user_id");

-- CreateIndex
CREATE INDEX "toeic_practice_runs_user_id_toeic_test_id_idx" ON "toeic_practice_runs"("user_id", "toeic_test_id");

-- CreateIndex
CREATE INDEX "toeic_practice_runs_user_id_completed_at_idx" ON "toeic_practice_runs"("user_id", "completed_at");

-- CreateIndex
CREATE INDEX "toeic_practice_runs_toeic_test_id_idx" ON "toeic_practice_runs"("toeic_test_id");

-- CreateIndex
CREATE INDEX "toeic_practice_run_questions_run_id_idx" ON "toeic_practice_run_questions"("run_id");

-- CreateIndex
CREATE INDEX "toeic_practice_run_questions_run_id_status_idx" ON "toeic_practice_run_questions"("run_id", "status");

-- CreateIndex
CREATE INDEX "toeic_practice_run_questions_run_id_part_number_question_number_idx" ON "toeic_practice_run_questions"("run_id", "part_number", "question_number");

-- CreateIndex
CREATE INDEX "toeic_practice_run_questions_toeic_question_id_idx" ON "toeic_practice_run_questions"("toeic_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_practice_run_questions_run_id_toeic_question_id_key" ON "toeic_practice_run_questions"("run_id", "toeic_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_practice_run_questions_run_id_sort_order_key" ON "toeic_practice_run_questions"("run_id", "sort_order");

-- AddForeignKey
ALTER TABLE "toeic_practice_runs" ADD CONSTRAINT "toeic_practice_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_practice_runs" ADD CONSTRAINT "toeic_practice_runs_toeic_test_id_fkey" FOREIGN KEY ("toeic_test_id") REFERENCES "toeic_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_practice_run_questions" ADD CONSTRAINT "toeic_practice_run_questions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "toeic_practice_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_practice_run_questions" ADD CONSTRAINT "toeic_practice_run_questions_toeic_question_id_fkey" FOREIGN KEY ("toeic_question_id") REFERENCES "toeic_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
