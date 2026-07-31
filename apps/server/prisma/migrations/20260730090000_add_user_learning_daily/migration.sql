CREATE TYPE "LearningActivityType" AS ENUM ('TEST_PRACTICE', 'TEST_REVIEW_WRONG');

CREATE TABLE "user_learning_daily" (
    "user_id" TEXT NOT NULL,
    "learned_on" DATE NOT NULL,
    "activity_type" "LearningActivityType" NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_learning_daily_pkey" PRIMARY KEY ("user_id", "learned_on", "activity_type"),
    CONSTRAINT "user_learning_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "user_learning_daily_user_id_learned_on_idx"
ON "user_learning_daily"("user_id", "learned_on");

ALTER TABLE "user_learning_daily" ENABLE ROW LEVEL SECURITY;
