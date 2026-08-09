DROP TABLE IF EXISTS "toeic_run_questions";
DROP TABLE IF EXISTS "toeic_run_groups";

CREATE TABLE "toeic_run_answers" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "toeic_question_id" INTEGER NOT NULL,
    "selected_key" TEXT NOT NULL,
    "status" "ToeicRunQuestionStatus" NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL,
    "graded_at" TIMESTAMP(3),
    CONSTRAINT "toeic_run_answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "toeic_run_answers_run_id_toeic_question_id_key" ON "toeic_run_answers"("run_id", "toeic_question_id");
CREATE INDEX "toeic_run_answers_run_id_status_idx" ON "toeic_run_answers"("run_id", "status");

ALTER TABLE "toeic_run_answers" ADD CONSTRAINT "toeic_run_answers_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "toeic_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "toeic_run_answers" ADD CONSTRAINT "toeic_run_answers_toeic_question_id_fkey" FOREIGN KEY ("toeic_question_id") REFERENCES "toeic_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
