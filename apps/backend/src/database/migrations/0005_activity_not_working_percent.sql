ALTER TABLE "lapkin_row_activities" ADD COLUMN IF NOT EXISTS "not_working_percent" numeric(5, 2);
UPDATE "lapkin_row_activities" SET "not_working_percent" = 100 WHERE "not_working" = true;
ALTER TABLE "lapkin_row_activities" DROP COLUMN IF EXISTS "not_working";
