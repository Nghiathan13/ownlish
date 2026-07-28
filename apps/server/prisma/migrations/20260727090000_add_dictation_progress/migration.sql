CREATE TABLE "dictation_progress" (
  "user_id" TEXT NOT NULL,
  "video_id" TEXT NOT NULL,
  "current_segment_id" TEXT,
  "correct_count" INTEGER NOT NULL DEFAULT 0,
  "wrong_count" INTEGER NOT NULL DEFAULT 0,
  "completed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dictation_progress_pkey" PRIMARY KEY ("user_id", "video_id"),
  CONSTRAINT "dictation_progress_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "dictation_progress" ENABLE ROW LEVEL SECURITY;

CREATE INDEX "dictation_progress_user_id_updated_at_idx"
  ON "dictation_progress"("user_id", "updated_at");
