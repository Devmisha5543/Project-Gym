CREATE TABLE IF NOT EXISTS platform_tenants (
    tenant_id UUID PRIMARY KEY,
    gym_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(320) NOT NULL,
    database_name VARCHAR(63) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'provisioning'
        CHECK (status IN ('provisioning', 'trial', 'active', 'suspended', 'archived', 'provisioning_failed')),
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_tenants_owner_email
    ON platform_tenants (LOWER(owner_email));

CREATE TABLE IF NOT EXISTS platform_plans (
    plan_code VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    billing_interval VARCHAR(16) NOT NULL
        CHECK (billing_interval IN ('month', 'year')),
    price_minor_units INTEGER NOT NULL CHECK (price_minor_units >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_subscriptions (
    subscription_id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES platform_tenants(tenant_id) ON DELETE RESTRICT,
    plan_code VARCHAR(64) REFERENCES platform_plans(plan_code),
    status VARCHAR(32) NOT NULL DEFAULT 'trial'
        CHECK (status IN ('trial', 'pending', 'active', 'past_due', 'cancelled', 'expired')),
    provider VARCHAR(64),
    provider_customer_id VARCHAR(255),
    provider_subscription_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_tenant
    ON platform_subscriptions (tenant_id, status);
