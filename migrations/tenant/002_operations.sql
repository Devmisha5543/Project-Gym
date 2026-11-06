CREATE TABLE IF NOT EXISTS member (
    member_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES branch(branch_id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(32),
    phone VARCHAR(50),
    address VARCHAR(255),
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    wants_trainer BOOLEAN NOT NULL DEFAULT FALSE,
    photo_filename VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS trainer (
    trainer_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(320),
    certification VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS trainerbranch (
    trainer_id INTEGER NOT NULL REFERENCES trainer(trainer_id) ON DELETE RESTRICT,
    branch_id INTEGER NOT NULL REFERENCES branch(branch_id) ON DELETE RESTRICT,
    PRIMARY KEY (trainer_id, branch_id)
);

CREATE TABLE IF NOT EXISTS membership (
    membership_id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES member(member_id) ON DELETE RESTRICT,
    plan_id INTEGER NOT NULL REFERENCES membershipplan(plan_id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL,
    CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS payment (
    payment_id SERIAL PRIMARY KEY,
    membership_id INTEGER NOT NULL REFERENCES membership(membership_id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS class (
    class_id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL REFERENCES trainer(trainer_id) ON DELETE RESTRICT,
    branch_id INTEGER NOT NULL REFERENCES branch(branch_id) ON DELETE RESTRICT,
    class_name VARCHAR(255) NOT NULL,
    schedule_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    capacity INTEGER NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS classbooking (
    booking_id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES member(member_id) ON DELETE RESTRICT,
    class_id INTEGER NOT NULL REFERENCES class(class_id) ON DELETE RESTRICT,
    booking_date TIMESTAMPTZ NOT NULL,
    cancel_date TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment (
    equipment_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES branch(branch_id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    condition VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS personaltrainingassignment (
    assignment_id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL REFERENCES trainer(trainer_id) ON DELETE RESTRICT,
    member_id INTEGER NOT NULL REFERENCES member(member_id) ON DELETE RESTRICT,
    speciality VARCHAR(255),
    start_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL
);
