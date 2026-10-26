ALTER TABLE MembershipPlan
    ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 30
    CHECK (duration_days > 0);
