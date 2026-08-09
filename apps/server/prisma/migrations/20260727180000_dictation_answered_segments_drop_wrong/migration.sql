-- AlterTable
ALTER TABLE "dictation_progress" DROP COLUMN "wrong_count";
ALTER TABLE "dictation_progress" ADD COLUMN "answered_segment_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
