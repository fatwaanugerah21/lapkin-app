ALTER TABLE "lapkin_rows" ADD COLUMN IF NOT EXISTS "kegiatan" jsonb;
--> statement-breakpoint
UPDATE "lapkin_rows" SET "kegiatan" = jsonb_build_array(
  jsonb_build_object(
    'uraianTugas', "uraian_tugas",
    'uraianHasil', "uraian_hasil",
    'hasilKinerja', CASE WHEN "hasil_kinerja" IS NULL THEN NULL ELSE to_jsonb(TRIM(BOTH FROM "hasil_kinerja"::text)) END,
    'tugasDinasLuar', CASE WHEN "tugas_dinas_luar" IS NULL THEN NULL ELSE to_jsonb(TRIM(BOTH FROM "tugas_dinas_luar"::text)) END,
    'ket', CASE WHEN "ket" IS NULL THEN NULL ELSE to_jsonb("ket") END
  )
)
WHERE "kegiatan" IS NULL;
--> statement-breakpoint
ALTER TABLE "lapkin_rows" ALTER COLUMN "kegiatan" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "uraian_tugas";
--> statement-breakpoint
ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "uraian_hasil";
--> statement-breakpoint
ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "hasil_kinerja";
--> statement-breakpoint
ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "tugas_dinas_luar";
--> statement-breakpoint
ALTER TABLE "lapkin_rows" DROP COLUMN IF EXISTS "ket";
