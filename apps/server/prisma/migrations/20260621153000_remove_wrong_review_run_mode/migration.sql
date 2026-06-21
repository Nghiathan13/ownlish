UPDATE "toeic_runs"
SET "mode" = 'PRACTICE'
WHERE "mode" = 'WRONG_REVIEW';

ALTER TYPE "ToeicRunMode" RENAME TO "ToeicRunMode_old";

CREATE TYPE "ToeicRunMode" AS ENUM ('PRACTICE', 'MOCK_TEST');

ALTER TABLE "toeic_runs" ALTER COLUMN "mode" DROP DEFAULT;

ALTER TABLE "toeic_runs"
ALTER COLUMN "mode" TYPE "ToeicRunMode"
USING ("mode"::text::"ToeicRunMode");

ALTER TABLE "toeic_runs" ALTER COLUMN "mode" SET DEFAULT 'PRACTICE';

DROP TYPE "ToeicRunMode_old";
