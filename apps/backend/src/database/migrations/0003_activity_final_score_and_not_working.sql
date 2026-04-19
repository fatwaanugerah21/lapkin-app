ALTER TABLE "lapkin_row_activities" ADD COLUMN IF NOT EXISTS "final_score" numeric(5, 2);
--> statement-breakpoint
ALTER TABLE "lapkin_row_activities" ADD COLUMN IF NOT EXISTS "not_working" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "lapkin_row_activities" AS a
SET "final_score" = lr."final_score"::numeric
FROM "lapkin_rows" AS lr
WHERE a."lapkin_row_id" = lr."id" AND lr."final_score" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "lapkin_rows" ADD COLUMN IF NOT EXISTS "manager_acknowledged" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "lapkin_rows" SET "manager_acknowledged" = true WHERE "final_score" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "final_score";
