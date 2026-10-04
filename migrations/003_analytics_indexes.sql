CREATE INDEX IF NOT EXISTS idx_branch_gym_branch
    ON branch (gym_id, branch_id);

CREATE INDEX IF NOT EXISTS idx_member_branch_join_date
    ON member (branch_id, join_date);

CREATE INDEX IF NOT EXISTS idx_membership_member_latest
    ON membership (member_id, end_date DESC, membership_id DESC);

CREATE INDEX IF NOT EXISTS idx_membership_plan
    ON membership (plan_id);

CREATE INDEX IF NOT EXISTS idx_payment_date_membership
    ON payment (payment_date, membership_id);
