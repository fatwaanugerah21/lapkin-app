CREATE TABLE IF NOT EXISTS "lapkin_row_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lapkin_row_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"task_description" text NOT NULL,
	"result_description" text NOT NULL,
	"performance_percent" numeric(5, 2),
	"field_duty_percent" numeric(5, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lapkin_row_activities" ADD CONSTRAINT "lapkin_row_activities_lapkin_row_id_lapkin_rows_id_fk" FOREIGN KEY ("lapkin_row_id") REFERENCES "public"."lapkin_rows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lapkin_rows' AND column_name = 'kegiatan'
  ) THEN
    INSERT INTO "lapkin_row_activities" ("lapkin_row_id", "sort_order", "task_description", "result_description", "performance_percent", "field_duty_percent", "notes")
    SELECT
      lr."id",
      t.ordinality::integer,
      COALESCE(t.elem->>'uraianTugas', ''),
      COALESCE(t.elem->>'uraianHasil', ''),
      CASE WHEN NULLIF(TRIM(t.elem->>'hasilKinerja'), '') IS NULL THEN NULL ELSE (NULLIF(TRIM(t.elem->>'hasilKinerja'), ''))::numeric END,
      CASE WHEN NULLIF(TRIM(t.elem->>'tugasDinasLuar'), '') IS NULL THEN NULL ELSE (NULLIF(TRIM(t.elem->>'tugasDinasLuar'), ''))::numeric END,
      NULLIF(TRIM(t.elem->>'ket'), '')
    FROM "lapkin_rows" lr
    CROSS JOIN LATERAL jsonb_array_elements(lr."kegiatan") WITH ORDINALITY AS t(elem, ordinality);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lapkin_rows' AND column_name = 'uraian_tugas'
  ) THEN
    INSERT INTO "lapkin_row_activities" ("lapkin_row_id", "sort_order", "task_description", "result_description", "performance_percent", "field_duty_percent", "notes")
    SELECT
      lr."id",
      1,
      lr."uraian_tugas",
      lr."uraian_hasil",
      lr."hasil_kinerja",
      lr."tugas_dinas_luar",
      lr."ket"
    FROM "lapkin_rows" lr;
    ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "uraian_tugas";
    ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "uraian_hasil";
    ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "hasil_kinerja";
    ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "tugas_dinas_luar";
    ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "ket";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "kegiatan";
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "jabatan" TO "job_title";
--> statement-breakpoint
ALTER TABLE "lapkins" RENAME COLUMN "pegawai_id" TO "employee_id";
--> statement-breakpoint
ALTER TABLE "lapkins" RENAME COLUMN "tanggal" TO "report_date";
--> statement-breakpoint
ALTER TABLE "lapkin_rows" RENAME COLUMN "no" TO "line_number";
--> statement-breakpoint
ALTER TABLE "lapkin_rows" RENAME COLUMN "waktu_mulai" TO "start_time";
--> statement-breakpoint
ALTER TABLE "lapkin_rows" RENAME COLUMN "waktu_selesai" TO "end_time";
--> statement-breakpoint
ALTER TABLE "lapkin_rows" RENAME COLUMN "nilai_akhir" TO "final_score";
