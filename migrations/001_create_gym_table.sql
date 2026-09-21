-- ====================================================================
-- Migration: 001_create_gym_table.sql
-- Description: Create Gym entity, backfill existing Admin and Branch records,
--              and enforce foreign key and NOT NULL constraints.
-- ====================================================================

-- 1. Create Gym table
CREATE TABLE IF NOT EXISTS gym (
    gym_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'USD',
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert default 'Project Gym' if no gym records exist
INSERT INTO gym (name, phone, email, address, currency, created_at)
SELECT 'Project Gym', NULL, NULL, NULL, 'USD', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM gym WHERE name = 'Project Gym');

-- 3. Add nullable gym_id columns to admin and branch
ALTER TABLE admin ADD COLUMN IF NOT EXISTS gym_id INT;
ALTER TABLE branch ADD COLUMN IF NOT EXISTS gym_id INT;

-- 4. Backfill existing records with the default gym_id
UPDATE admin 
SET gym_id = (SELECT gym_id FROM gym WHERE name = 'Project Gym' ORDER BY gym_id LIMIT 1) 
WHERE gym_id IS NULL;

UPDATE branch 
SET gym_id = (SELECT gym_id FROM gym WHERE name = 'Project Gym' ORDER BY gym_id LIMIT 1) 
WHERE gym_id IS NULL;

-- 5. Set default gym_id on admin and branch to preserve compatibility with existing un-scoped inserts
DO $$
DECLARE
    v_gym_id INT;
BEGIN
    SELECT gym_id INTO v_gym_id FROM gym WHERE name = 'Project Gym' ORDER BY gym_id LIMIT 1;
    EXECUTE format('ALTER TABLE admin ALTER COLUMN gym_id SET DEFAULT %s;', v_gym_id);
    EXECUTE format('ALTER TABLE branch ALTER COLUMN gym_id SET DEFAULT %s;', v_gym_id);
END $$;

-- 6. Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_admin_gym' AND table_name = 'admin'
    ) THEN
        ALTER TABLE admin ADD CONSTRAINT fk_admin_gym FOREIGN KEY (gym_id) REFERENCES gym(gym_id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_branch_gym' AND table_name = 'branch'
    ) THEN
        ALTER TABLE branch ADD CONSTRAINT fk_branch_gym FOREIGN KEY (gym_id) REFERENCES gym(gym_id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 7. Add NOT NULL constraints now that all rows are backfilled
ALTER TABLE admin ALTER COLUMN gym_id SET NOT NULL;
ALTER TABLE branch ALTER COLUMN gym_id SET NOT NULL;
