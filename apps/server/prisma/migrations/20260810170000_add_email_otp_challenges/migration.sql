CREATE TABLE "email_otp_challenges" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "enrollment_token_hash" TEXT,
    "enrollment_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "email_otp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_otp_challenges_email_last_sent_at_idx" ON "email_otp_challenges"("email", "last_sent_at");
CREATE INDEX "email_otp_challenges_email_expires_at_idx" ON "email_otp_challenges"("email", "expires_at");
CREATE INDEX "email_otp_challenges_enrollment_token_hash_idx" ON "email_otp_challenges"("enrollment_token_hash");

ALTER TABLE "email_otp_challenges" ADD CONSTRAINT "email_otp_challenges_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
