-- Add a stable Google identity for existing admin accounts.
ALTER TABLE admin ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_google_sub
    ON admin (google_sub)
    WHERE google_sub IS NOT NULL;
