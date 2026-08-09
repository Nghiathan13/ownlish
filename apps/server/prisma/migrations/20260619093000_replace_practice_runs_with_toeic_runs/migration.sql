-- Drop old experimental practice-run tables from the previous unshipped design.
DROP TABLE IF EXISTS "toeic_practice_run_questions";
DROP TABLE IF EXISTS "toeic_practice_runs";
DROP TYPE IF EXISTS "ToeicPracticeRunQuestionStatus";
DROP TYPE IF EXISTS "ToeicPracticeRunMode";

-- CreateEnum
CREATE TYPE "ToeicRunMode" AS ENUM ('PRACTICE', 'WRONG_REVIEW');

-- CreateEnum
CREATE TYPE "ToeicRunGroupStatus" AS ENUM ('RIGHT', 'WRONG');

-- CreateEnum
CREATE TYPE "ToeicRunQuestionStatus" AS ENUM ('SELECTED', 'RIGHT', 'WRONG');

-- CreateTable
CREATE TABLE "toeic_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "toeic_test_id" INTEGER NOT NULL,
    "mode" "ToeicRunMode" NOT NULL DEFAULT 'PRACTICE',
    "selected_parts" INTEGER[] NOT NULL,
    "current_question_index" INTEGER NOT NULL DEFAULT 0,
    "total_right" INTEGER NOT NULL DEFAULT 0,
    "total_wrong" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "toeic_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_run_groups" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "toeic_question_group_id" INTEGER NOT NULL,
    "part_number" INTEGER NOT NULL,
    "question_start" INTEGER NOT NULL,
    "question_end" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "status" "ToeicRunGroupStatus",

    CONSTRAINT "toeic_run_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_run_questions" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "run_group_id" TEXT NOT NULL,
    "toeic_question_id" INTEGER NOT NULL,
    "part_number" INTEGER NOT NULL,
    "question_number" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "selected_key" TEXT,
    "status" "ToeicRunQuestionStatus",
    "answered_at" TIMESTAMP(3),
    "graded_at" TIMESTAMP(3),

    CONSTRAINT "toeic_run_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "toeic_runs_user_id_idx" ON "toeic_runs"("user_id");

-- CreateIndex
CREATE INDEX "toeic_runs_user_id_toeic_test_id_mode_created_at_idx" ON "toeic_runs"("user_id", "toeic_test_id", "mode", "created_at");

-- CreateIndex
CREATE INDEX "toeic_runs_toeic_test_id_idx" ON "toeic_runs"("toeic_test_id");

-- CreateIndex
CREATE INDEX "toeic_run_groups_run_id_idx" ON "toeic_run_groups"("run_id");

-- CreateIndex
CREATE INDEX "toeic_run_groups_run_id_status_idx" ON "toeic_run_groups"("run_id", "status");

-- CreateIndex
CREATE INDEX "toeic_run_groups_run_id_part_number_idx" ON "toeic_run_groups"("run_id", "part_number");

-- CreateIndex
CREATE INDEX "toeic_run_groups_toeic_question_group_id_idx" ON "toeic_run_groups"("toeic_question_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_run_groups_run_id_toeic_question_group_id_key" ON "toeic_run_groups"("run_id", "toeic_question_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_run_groups_run_id_sort_order_key" ON "toeic_run_groups"("run_id", "sort_order");

-- CreateIndex
CREATE INDEX "toeic_run_questions_run_id_idx" ON "toeic_run_questions"("run_id");

-- CreateIndex
CREATE INDEX "toeic_run_questions_run_id_status_idx" ON "toeic_run_questions"("run_id", "status");

-- CreateIndex
CREATE INDEX "toeic_run_questions_run_group_id_idx" ON "toeic_run_questions"("run_group_id");

-- CreateIndex
CREATE INDEX "toeic_run_questions_run_group_id_status_idx" ON "toeic_run_questions"("run_group_id", "status");

-- CreateIndex
CREATE INDEX "toeic_run_questions_toeic_question_id_idx" ON "toeic_run_questions"("toeic_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_run_questions_run_id_toeic_question_id_key" ON "toeic_run_questions"("run_id", "toeic_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_run_questions_run_id_sort_order_key" ON "toeic_run_questions"("run_id", "sort_order");

-- AddForeignKey
ALTER TABLE "toeic_runs" ADD CONSTRAINT "toeic_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_runs" ADD CONSTRAINT "toeic_runs_toeic_test_id_fkey" FOREIGN KEY ("toeic_test_id") REFERENCES "toeic_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_run_groups" ADD CONSTRAINT "toeic_run_groups_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "toeic_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_run_groups" ADD CONSTRAINT "toeic_run_groups_toeic_question_group_id_fkey" FOREIGN KEY ("toeic_question_group_id") REFERENCES "toeic_question_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_run_questions" ADD CONSTRAINT "toeic_run_questions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "toeic_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_run_questions" ADD CONSTRAINT "toeic_run_questions_run_group_id_fkey" FOREIGN KEY ("run_group_id") REFERENCES "toeic_run_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_run_questions" ADD CONSTRAINT "toeic_run_questions_toeic_question_id_fkey" FOREIGN KEY ("toeic_question_id") REFERENCES "toeic_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
