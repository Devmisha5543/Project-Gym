CREATE TABLE IF NOT EXISTS gym (
    gym_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(320),
    address VARCHAR(255),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    logo_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    phone VARCHAR(50),
    password_hash TEXT NOT NULL,
    gym_id INTEGER NOT NULL REFERENCES gym(gym_id) ON DELETE RESTRICT,
    role VARCHAR(32) NOT NULL DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS branch (
    branch_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100),
    gym_id INTEGER NOT NULL REFERENCES gym(gym_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS membershipplan (
    plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    perks TEXT,
    duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES admin(admin_id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
