-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('boy', 'girl');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "email" VARCHAR(64) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "gender" "Gender",
    "due_date" DATE,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(96) NOT NULL,
    "date" DATE NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(64) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotions" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(64) NOT NULL,

    CONSTRAINT "emotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_entry_emotions" (
    "diary_entry_id" TEXT NOT NULL,
    "emotion_id" TEXT NOT NULL,

    CONSTRAINT "diary_entry_emotions_pkey" PRIMARY KEY ("diary_entry_id","emotion_id")
);

-- CreateTable
CREATE TABLE "week_baby_states" (
    "week_number" INTEGER NOT NULL,
    "analogy" TEXT,
    "baby_size" INTEGER NOT NULL,
    "baby_weight" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "baby_activity" TEXT NOT NULL,
    "baby_development" TEXT NOT NULL,
    "interesting_fact" TEXT NOT NULL,
    "mom_daily_tips" TEXT[],

    CONSTRAINT "week_baby_states_pkey" PRIMARY KEY ("week_number")
);

-- CreateTable
CREATE TABLE "week_mom_states" (
    "week_number" INTEGER NOT NULL,
    "feelings_states" TEXT[],
    "sensation_descr" TEXT NOT NULL,
    "comfort_tips" JSONB NOT NULL,

    CONSTRAINT "week_mom_states_pkey" PRIMARY KEY ("week_number")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "tasks_user_id_date_idx" ON "tasks"("user_id", "date");

-- CreateIndex
CREATE INDEX "diary_entries_user_id_date_idx" ON "diary_entries"("user_id", "date");

-- CreateIndex
CREATE INDEX "diary_entry_emotions_emotion_id_idx" ON "diary_entry_emotions"("emotion_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entry_emotions" ADD CONSTRAINT "diary_entry_emotions_diary_entry_id_fkey" FOREIGN KEY ("diary_entry_id") REFERENCES "diary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entry_emotions" ADD CONSTRAINT "diary_entry_emotions_emotion_id_fkey" FOREIGN KEY ("emotion_id") REFERENCES "emotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
