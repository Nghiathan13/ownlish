-- CreateEnum
CREATE TYPE "ToeicPracticeMode" AS ENUM ('NORMAL', 'WRONG_QUESTIONS');

-- CreateTable
CREATE TABLE "toeic_tests" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "test_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_test_parts" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "part_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_test_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_question_groups" (
    "id" SERIAL NOT NULL,
    "test_part_id" INTEGER NOT NULL,
    "question_start" INTEGER NOT NULL,
    "question_end" INTEGER NOT NULL,
    "group_type" TEXT,
    "accent" TEXT,
    "content" TEXT,
    "content_vi" TEXT,
    "audio_storage_path" TEXT,
    "image_storage_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_question_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_questions" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "question_number" INTEGER NOT NULL,
    "question" TEXT,
    "question_vi" TEXT,
    "question_type" TEXT,
    "option_a" TEXT,
    "option_b" TEXT,
    "option_c" TEXT,
    "option_d" TEXT,
    "option_a_vi" TEXT,
    "option_b_vi" TEXT,
    "option_c_vi" TEXT,
    "option_d_vi" TEXT,
    "answer_key" TEXT,
    "explanation_vi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_practice_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "toeic_test_id" INTEGER NOT NULL,
    "part_number" INTEGER NOT NULL,
    "mode" "ToeicPracticeMode" NOT NULL DEFAULT 'NORMAL',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_practice_answers" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "toeic_question_id" INTEGER NOT NULL,
    "selected_key" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "toeic_practice_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_wrong_questions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "toeic_question_id" INTEGER NOT NULL,
    "last_wrong_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wrong_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_wrong_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_test_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "toeic_test_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "total_correct" INTEGER NOT NULL DEFAULT 0,
    "total_wrong" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_test_attempt_parts" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "part_number" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_test_attempt_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "toeic_tests_year_test_number_key" ON "toeic_tests"("year", "test_number");

-- CreateIndex
CREATE INDEX "toeic_test_parts_test_id_idx" ON "toeic_test_parts"("test_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_test_parts_test_id_part_number_key" ON "toeic_test_parts"("test_id", "part_number");

-- CreateIndex
CREATE INDEX "toeic_question_groups_test_part_id_idx" ON "toeic_question_groups"("test_part_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_question_groups_test_part_id_question_start_question__key" ON "toeic_question_groups"("test_part_id", "question_start", "question_end");

-- CreateIndex
CREATE INDEX "toeic_questions_group_id_idx" ON "toeic_questions"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_questions_group_id_question_number_key" ON "toeic_questions"("group_id", "question_number");

-- CreateIndex
CREATE INDEX "toeic_practice_sessions_user_id_idx" ON "toeic_practice_sessions"("user_id");

-- CreateIndex
CREATE INDEX "toeic_practice_sessions_user_id_toeic_test_id_part_number_idx" ON "toeic_practice_sessions"("user_id", "toeic_test_id", "part_number");

-- CreateIndex
CREATE INDEX "toeic_practice_answers_session_id_idx" ON "toeic_practice_answers"("session_id");

-- CreateIndex
CREATE INDEX "toeic_practice_answers_toeic_question_id_idx" ON "toeic_practice_answers"("toeic_question_id");

-- CreateIndex
CREATE INDEX "toeic_wrong_questions_user_id_idx" ON "toeic_wrong_questions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_wrong_questions_user_id_toeic_question_id_key" ON "toeic_wrong_questions"("user_id", "toeic_question_id");

-- CreateIndex
CREATE INDEX "toeic_test_attempts_user_id_idx" ON "toeic_test_attempts"("user_id");

-- CreateIndex
CREATE INDEX "toeic_test_attempt_parts_attempt_id_idx" ON "toeic_test_attempt_parts"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_test_attempt_parts_attempt_id_part_number_key" ON "toeic_test_attempt_parts"("attempt_id", "part_number");

-- AddForeignKey
ALTER TABLE "toeic_test_parts" ADD CONSTRAINT "toeic_test_parts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "toeic_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_question_groups" ADD CONSTRAINT "toeic_question_groups_test_part_id_fkey" FOREIGN KEY ("test_part_id") REFERENCES "toeic_test_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_questions" ADD CONSTRAINT "toeic_questions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "toeic_question_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_practice_sessions" ADD CONSTRAINT "toeic_practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_practice_answers" ADD CONSTRAINT "toeic_practice_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "toeic_practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_practice_answers" ADD CONSTRAINT "toeic_practice_answers_toeic_question_id_fkey" FOREIGN KEY ("toeic_question_id") REFERENCES "toeic_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_wrong_questions" ADD CONSTRAINT "toeic_wrong_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_wrong_questions" ADD CONSTRAINT "toeic_wrong_questions_toeic_question_id_fkey" FOREIGN KEY ("toeic_question_id") REFERENCES "toeic_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_test_attempts" ADD CONSTRAINT "toeic_test_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_test_attempt_parts" ADD CONSTRAINT "toeic_test_attempt_parts_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "toeic_test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
