CREATE TYPE "ExperienceEventKind" AS ENUM (
  'TEST_CORRECT',
  'TEST_MILESTONE',
  'MOCK_CORRECT',
  'MOCK_MILESTONE',
  'MOCK_PART',
  'DICTATION_SEGMENT',
  'DICTATION_VIDEO',
  'REVIEW_EASY'
);

CREATE TYPE "ReviewGradeSource" AS ENUM ('USER_VOCAB', 'OXFORD');

CREATE TABLE "user_experience" (
  "user_id" TEXT NOT NULL,
  "total_xp" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_experience_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "experience_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "learned_on" DATE NOT NULL,
  "kind" "ExperienceEventKind" NOT NULL,
  "subject_key" TEXT NOT NULL,
  "xp" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "experience_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_grade_receipts" (
  "user_id" TEXT NOT NULL,
  "submission_id" UUID NOT NULL,
  "source" "ReviewGradeSource" NOT NULL,
  "subject_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "review_grade_receipts_pkey" PRIMARY KEY ("user_id", "submission_id")
);

CREATE TABLE "dictation_catalog_videos" (
  "video_id" TEXT NOT NULL,
  "segment_count" INTEGER NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dictation_catalog_videos_pkey" PRIMARY KEY ("video_id")
);

CREATE TABLE "dictation_catalog_segments" (
  "video_id" TEXT NOT NULL,
  "segment_id" TEXT NOT NULL,
  "transcript" TEXT NOT NULL,

  CONSTRAINT "dictation_catalog_segments_pkey" PRIMARY KEY ("video_id", "segment_id")
);

CREATE UNIQUE INDEX "experience_events_user_id_learned_on_kind_subject_key_key"
ON "experience_events"("user_id", "learned_on", "kind", "subject_key");

CREATE INDEX "experience_events_user_id_learned_on_kind_idx"
ON "experience_events"("user_id", "learned_on", "kind");

CREATE INDEX "experience_events_user_id_idx"
ON "experience_events"("user_id");

ALTER TABLE "user_experience"
ADD CONSTRAINT "user_experience_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "experience_events"
ADD CONSTRAINT "experience_events_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_grade_receipts"
ADD CONSTRAINT "review_grade_receipts_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dictation_catalog_segments"
ADD CONSTRAINT "dictation_catalog_segments_video_id_fkey"
FOREIGN KEY ("video_id") REFERENCES "dictation_catalog_videos"("video_id") ON DELETE CASCADE ON UPDATE CASCADE;
