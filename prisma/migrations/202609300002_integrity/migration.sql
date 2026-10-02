-- Enforce ledger and audit append-only behavior even if a future service is incorrect.
CREATE FUNCTION prevent_record_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION '% is append-only', TG_TABLE_NAME; END;
$$;
CREATE TRIGGER point_ledger_immutable BEFORE UPDATE OR DELETE ON "PointEntry" FOR EACH ROW EXECUTE FUNCTION prevent_record_mutation();
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION prevent_record_mutation();
ALTER TABLE "Category" ADD CONSTRAINT category_points_range CHECK ("basePoints" BETWEEN 1 AND 1000);
ALTER TABLE "Category" ADD CONSTRAINT category_weight_range CHECK (multiplier BETWEEN 0.1 AND 5);
ALTER TABLE "Department" ADD CONSTRAINT department_sla_range CHECK ("slaDays" BETWEEN 1 AND 30);
ALTER TABLE "Evidence" ADD CONSTRAINT evidence_size_range CHECK ("sizeBytes" > 0 AND "sizeBytes" <= 10485760);
CREATE UNIQUE INDEX one_active_semester ON "Semester" ((active)) WHERE active = true;
