-- CreateTable
CREATE TABLE "toeic_part_practice_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "part_number" INTEGER NOT NULL,
    "total_right" INTEGER NOT NULL DEFAULT 0,
    "total_wrong" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toeic_part_practice_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_part_practice_groups" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "toeic_question_group_id" INTEGER NOT NULL,
    "toeic_test_id" INTEGER NOT NULL,
    "part_number" INTEGER NOT NULL,
    "question_start" INTEGER NOT NULL,
    "question_end" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "status" "ToeicRunGroupStatus",

    CONSTRAINT "toeic_part_practice_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toeic_part_practice_questions" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "run_group_id" TEXT NOT NULL,
    "toeic_question_id" INTEGER NOT NULL,
    "toeic_test_id" INTEGER NOT NULL,
    "part_number" INTEGER NOT NULL,
    "question_number" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "selected_key" TEXT,
    "status" "ToeicRunQuestionStatus",
    "answered_at" TIMESTAMP(3),
    "graded_at" TIMESTAMP(3),

    CONSTRAINT "toeic_part_practice_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "toeic_part_practice_runs_user_id_idx" ON "toeic_part_practice_runs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_part_practice_runs_user_id_part_number_key" ON "toeic_part_practice_runs"("user_id", "part_number");

-- CreateIndex
CREATE INDEX "toeic_part_practice_groups_run_id_idx" ON "toeic_part_practice_groups"("run_id");

-- CreateIndex
CREATE INDEX "toeic_part_practice_groups_run_id_status_idx" ON "toeic_part_practice_groups"("run_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_part_practice_groups_run_id_toeic_question_group_id_key" ON "toeic_part_practice_groups"("run_id", "toeic_question_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_part_practice_groups_run_id_sort_order_key" ON "toeic_part_practice_groups"("run_id", "sort_order");

-- CreateIndex
CREATE INDEX "toeic_part_practice_questions_run_id_idx" ON "toeic_part_practice_questions"("run_id");

-- CreateIndex
CREATE INDEX "toeic_part_practice_questions_run_id_status_idx" ON "toeic_part_practice_questions"("run_id", "status");

-- CreateIndex
CREATE INDEX "toeic_part_practice_questions_run_group_id_idx" ON "toeic_part_practice_questions"("run_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_part_practice_questions_run_id_toeic_question_id_key" ON "toeic_part_practice_questions"("run_id", "toeic_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "toeic_part_practice_questions_run_id_sort_order_key" ON "toeic_part_practice_questions"("run_id", "sort_order");

-- AddForeignKey
ALTER TABLE "toeic_part_practice_runs" ADD CONSTRAINT "toeic_part_practice_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_part_practice_groups" ADD CONSTRAINT "toeic_part_practice_groups_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "toeic_part_practice_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_part_practice_groups" ADD CONSTRAINT "toeic_part_practice_groups_toeic_question_group_id_fkey" FOREIGN KEY ("toeic_question_group_id") REFERENCES "toeic_question_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_part_practice_groups" ADD CONSTRAINT "toeic_part_practice_groups_toeic_test_id_fkey" FOREIGN KEY ("toeic_test_id") REFERENCES "toeic_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_part_practice_questions" ADD CONSTRAINT "toeic_part_practice_questions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "toeic_part_practice_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_part_practice_questions" ADD CONSTRAINT "toeic_part_practice_questions_run_group_id_fkey" FOREIGN KEY ("run_group_id") REFERENCES "toeic_part_practice_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_part_practice_questions" ADD CONSTRAINT "toeic_part_practice_questions_toeic_question_id_fkey" FOREIGN KEY ("toeic_question_id") REFERENCES "toeic_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toeic_part_practice_questions" ADD CONSTRAINT "toeic_part_practice_questions_toeic_test_id_fkey" FOREIGN KEY ("toeic_test_id") REFERENCES "toeic_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
