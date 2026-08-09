DROP TABLE "toeic_part_practice_answers";
DROP TABLE "toeic_run_answers";
DROP TABLE "toeic_part_practice_runs";
DROP TABLE "toeic_runs";
DROP TABLE "toeic_questions";
DROP TABLE "toeic_question_groups";
DROP TABLE "toeic_test_parts";
DROP TABLE "toeic_tests";

ALTER TABLE "toeic_learning_runs" RENAME TO "toeic_runs";
ALTER TABLE "toeic_learning_run_answers" RENAME TO "toeic_run_answers";

ALTER TYPE "ToeicLearningScope" RENAME TO "ToeicRunScope";
DROP TYPE "ToeicRunGroupStatus";

ALTER TABLE "toeic_runs" RENAME CONSTRAINT "toeic_learning_runs_pkey" TO "toeic_runs_pkey";
ALTER TABLE "toeic_runs" RENAME CONSTRAINT "toeic_learning_runs_scope_shape_check" TO "toeic_runs_scope_shape_check";
ALTER TABLE "toeic_runs" RENAME CONSTRAINT "toeic_learning_runs_mock_scope_check" TO "toeic_runs_mock_scope_check";
ALTER TABLE "toeic_runs" RENAME CONSTRAINT "toeic_learning_runs_selected_parts_check" TO "toeic_runs_selected_parts_check";
ALTER TABLE "toeic_runs" RENAME CONSTRAINT "toeic_learning_runs_user_id_fkey" TO "toeic_runs_user_id_fkey";
ALTER TABLE "toeic_run_answers" RENAME CONSTRAINT "toeic_learning_run_answers_pkey" TO "toeic_run_answers_pkey";
ALTER TABLE "toeic_run_answers" RENAME CONSTRAINT "toeic_learning_run_answers_run_id_fkey" TO "toeic_run_answers_run_id_fkey";

ALTER INDEX "toeic_learning_runs_user_id_idx" RENAME TO "toeic_runs_user_id_idx";
ALTER INDEX "toeic_learning_runs_user_catalog_scope_created_at_idx" RENAME TO "toeic_runs_user_catalog_scope_created_at_idx";
ALTER INDEX "toeic_learning_runs_finish_requested_completed_idx" RENAME TO "toeic_runs_finish_requested_completed_idx";
ALTER INDEX "toeic_learning_runs_practice_test_key" RENAME TO "toeic_runs_practice_test_key";
ALTER INDEX "toeic_learning_runs_practice_part_key" RENAME TO "toeic_runs_practice_part_key";
ALTER INDEX "toeic_learning_runs_open_mock_selection_lookup_idx" RENAME TO "toeic_runs_open_mock_selection_lookup_idx";
ALTER INDEX "toeic_learning_run_answers_run_id_question_key_key" RENAME TO "toeic_run_answers_run_id_question_key_key";
ALTER INDEX "toeic_learning_run_answers_run_id_status_idx" RENAME TO "toeic_run_answers_run_id_status_idx";
