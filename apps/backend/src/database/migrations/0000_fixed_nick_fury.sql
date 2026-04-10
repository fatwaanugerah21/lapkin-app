DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('admin', 'pegawai', 'manager');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."lapkin_status" AS ENUM('draft', 'locked', 'evaluated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"nip" varchar(50) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'pegawai' NOT NULL,
	"jabatan" varchar(255) NOT NULL,
	"manager_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_nip_unique" UNIQUE("nip"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lapkin_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lapkin_id" uuid NOT NULL,
	"no" integer NOT NULL,
	"waktu_mulai" varchar(10) NOT NULL,
	"waktu_selesai" varchar(10) NOT NULL,
	"uraian_tugas" text NOT NULL,
	"uraian_hasil" text NOT NULL,
	"hasil_kinerja" numeric(5, 2),
	"tugas_dinas_luar" numeric(5, 2),
	"ket" text,
	"nilai_akhir" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lapkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pegawai_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"status" "lapkin_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lapkin_rows" ADD CONSTRAINT "lapkin_rows_lapkin_id_lapkins_id_fk" FOREIGN KEY ("lapkin_id") REFERENCES "public"."lapkins"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lapkins" ADD CONSTRAINT "lapkins_pegawai_id_users_id_fk" FOREIGN KEY ("pegawai_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
