-- Drop old part practice tables
DROP TABLE IF EXISTS "toeic_part_practice_questions";
DROP TABLE IF EXISTS "toeic_part_practice_groups";

-- CreateTable
CREATE TABLE "toeic_part_practice_answers" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "toeic_question_id" INTEGER NOT NULL,
    "selected_key" TEXT NOT NULL,
    "status" "ToeicRunQuestionStatus" NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL,
    "graded_at" TIMESTAMP(3),

    CONSTRAINT "toeic_part_practice_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "toeic_part_practice_answers_run_id_toeic_question_id_key" ON "toeic_part_practice_answers"("run_id", "toeic_question_id");

-- CreateIndex
CREATE INDEX "toeic_part_practice_answers_run_id_status_idx" ON "toeic_part_practice_answers"("run_id", "status");

-- AddForeignKey
ALTER TABLE "toeic_part_practice_answers" ADD CONSTRAINT "toeic_part_practice_answers_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "toeic_part_practice_runs"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_part_practice_answers" ADD CONSTRAINT "toeic_part_practice_answers_toeic_question_id_fkey" FOREIGN KEY ("toeic_question_id") REFERENCES "toeic_questions"("id") ON DELETE CASCADE;
