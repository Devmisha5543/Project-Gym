CREATE INDEX IF NOT EXISTS idx_admin_gym ON admin (gym_id);
CREATE INDEX IF NOT EXISTS idx_branch_gym ON branch (gym_id);
CREATE INDEX IF NOT EXISTS idx_member_branch_join_date ON member (branch_id, join_date);
CREATE INDEX IF NOT EXISTS idx_membership_member_latest
    ON membership (member_id, end_date DESC, membership_id DESC);
CREATE INDEX IF NOT EXISTS idx_membership_plan ON membership (plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_date_membership ON payment (payment_date, membership_id);
CREATE INDEX IF NOT EXISTS idx_class_branch ON class (branch_id);
CREATE INDEX IF NOT EXISTS idx_classbooking_member ON classbooking (member_id);
CREATE INDEX IF NOT EXISTS idx_classbooking_class ON classbooking (class_id);
CREATE INDEX IF NOT EXISTS idx_equipment_branch ON equipment (branch_id);
CREATE INDEX IF NOT EXISTS idx_assignment_member ON personaltrainingassignment (member_id);
CREATE INDEX IF NOT EXISTS idx_assignment_trainer ON personaltrainingassignment (trainer_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
    ON password_reset_tokens (user_id);
