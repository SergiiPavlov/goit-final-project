-- Align DB types with seed JSON
-- - baby_size / baby_weight need fractional values
-- - array columns should be NOT NULL with default empty arrays

-- WeekBabyState: numeric types
ALTER TABLE "week_baby_states"
  ALTER COLUMN "baby_size" TYPE DOUBLE PRECISION USING "baby_size"::DOUBLE PRECISION;

ALTER TABLE "week_baby_states"
  ALTER COLUMN "baby_weight" TYPE DOUBLE PRECISION USING "baby_weight"::DOUBLE PRECISION;

-- WeekBabyState: arrays
UPDATE "week_baby_states"
SET "mom_daily_tips" = ARRAY[]::TEXT[]
WHERE "mom_daily_tips" IS NULL;

ALTER TABLE "week_baby_states"
  ALTER COLUMN "mom_daily_tips" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "mom_daily_tips" SET NOT NULL;

-- WeekMomState: arrays
UPDATE "week_mom_states"
SET "feelings_states" = ARRAY[]::TEXT[]
WHERE "feelings_states" IS NULL;

ALTER TABLE "week_mom_states"
  ALTER COLUMN "feelings_states" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "feelings_states" SET NOT NULL;
