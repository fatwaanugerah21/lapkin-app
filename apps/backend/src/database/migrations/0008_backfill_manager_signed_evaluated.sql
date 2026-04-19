-- LAPKINs that were marked evaluated before per-LAPKIN sign-off: treat as signed.
UPDATE "lapkins"
SET "manager_signed_at" = COALESCE("manager_signed_at", "updated_at")
WHERE "status" = 'evaluated' AND "manager_signed_at" IS NULL;
