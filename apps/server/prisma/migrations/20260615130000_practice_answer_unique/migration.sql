-- CreateIndex
CREATE UNIQUE INDEX "toeic_practice_answers_session_id_toeic_question_id_key" ON "toeic_practice_answers"("session_id", "toeic_question_id");
