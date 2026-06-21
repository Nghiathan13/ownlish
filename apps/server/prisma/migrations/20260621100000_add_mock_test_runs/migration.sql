ALTER TYPE "ToeicRunMode" ADD VALUE 'MOCK_TEST';

ALTER TABLE "toeic_runs" ADD COLUMN "completed_at" TIMESTAMP(3);
