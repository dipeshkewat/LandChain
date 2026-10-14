-- LandChain Database Migration: Initial Schema
-- Run with: psql -d landchain -f 001_initial_schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── users ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    wallet_address  VARCHAR(42),
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer'
                        CHECK (role IN ('admin', 'owner', 'viewer')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users (wallet_address) WHERE wallet_address IS NOT NULL;

-- ── properties ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_code           VARCHAR(80) NOT NULL UNIQUE,
    location                TEXT NOT NULL,
    area_sq_m               NUMERIC(12,2) NOT NULL CHECK (area_sq_m > 0),
    description             TEXT,
    document_hash           CHAR(64),
    document_uri            TEXT,
    current_owner_address   VARCHAR(42),
    blockchain_property_id  NUMERIC(78,0),
    created_by              UUID REFERENCES users(id),
    registration_tx_hash    VARCHAR(66),
    chain_status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                                CHECK (chain_status IN ('pending', 'confirmed', 'failed', 'needs_reconciliation')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_code ON properties (property_code);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING gin (to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_properties_chain_status ON properties (chain_status);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties (current_owner_address) WHERE current_owner_address IS NOT NULL;

-- ── ownership_transfers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ownership_transfers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id       UUID NOT NULL REFERENCES properties(id),
    from_address      VARCHAR(42) NOT NULL,
    to_address        VARCHAR(42) NOT NULL,
    transaction_hash  VARCHAR(66) UNIQUE,
    block_number      BIGINT,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_property ON ownership_transfers (property_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON ownership_transfers (status);

-- ── audit_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(80) NOT NULL,
    entity_type VARCHAR(40) NOT NULL CHECK (entity_type IN ('property', 'transfer', 'user')),
    entity_id   UUID,
    details     JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
