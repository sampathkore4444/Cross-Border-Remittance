BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('sender', 'recipient', 'agent', 'admin');
CREATE TYPE kyc_level AS ENUM ('unverified', 'level_1', 'level_2', 'level_3');
CREATE TYPE payment_method AS ENUM ('promptpay_qr', 'bank_transfer', 'truemoney', 'agent_cash');
CREATE TYPE payout_method AS ENUM ('bcel_cash', 'seven_eleven_cash', 'agent_cash', 'mobile_topup', 'bcel_wallet', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'received', 'failed', 'refunded', 'expired');
CREATE TYPE payout_status AS ENUM ('pending', 'initiated', 'completed', 'failed', 'refunded');
CREATE TYPE agent_type AS ENUM ('cash_in_agent', 'cash_out_agent');

CREATE TABLE users (
    id VARCHAR(20) PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    country_code VARCHAR(5) NOT NULL DEFAULT '+66',
    name VARCHAR(255) NOT NULL DEFAULT '',
    date_of_birth VARCHAR(20),
    role user_role NOT NULL DEFAULT 'sender',
    kyc_level kyc_level NOT NULL DEFAULT 'unverified',
    language VARCHAR(5) NOT NULL DEFAULT 'lo',
    device_id VARCHAR(255),
    fcm_token VARCHAR(512),
    hms_token VARCHAR(512),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE kyc_documents (
    id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL REFERENCES users(id),
    doc_type VARCHAR(50) NOT NULL,
    doc_number VARCHAR(100),
    front_url TEXT,
    back_url TEXT,
    selfie_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kyc_documents_user ON kyc_documents(user_id);

CREATE TABLE transactions (
    id VARCHAR(24) PRIMARY KEY,
    transaction_ref VARCHAR(64) UNIQUE NOT NULL,
    idempotency_key VARCHAR(64) UNIQUE,
    sender_id VARCHAR(20) NOT NULL REFERENCES users(id),
    sender_device_id VARCHAR(255),
    source_currency VARCHAR(5) NOT NULL DEFAULT 'THB',
    source_amount DOUBLE PRECISION NOT NULL,
    source_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
    payment_method payment_method,
    payment_reference VARCHAR(255),
    payment_status payment_status NOT NULL DEFAULT 'pending',
    exchange_rate DOUBLE PRECISION NOT NULL,
    mid_market_rate DOUBLE PRECISION,
    rate_locked_at TIMESTAMPTZ,
    target_currency VARCHAR(5) NOT NULL DEFAULT 'LAK',
    target_amount BIGINT NOT NULL,
    payout_method payout_method,
    payout_status payout_status NOT NULL DEFAULT 'pending',
    payout_reference VARCHAR(255),
    payout_fee BIGINT NOT NULL DEFAULT 0,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_id VARCHAR(20),
    pickup_code VARCHAR(20),
    pickup_expires_at TIMESTAMPTZ,
    quoted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_ref ON transactions(transaction_ref);
CREATE INDEX idx_transactions_sender ON transactions(sender_id);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);

CREATE TABLE transaction_status_logs (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(transaction_ref),
    status_from VARCHAR(20),
    status_to VARCHAR(20) NOT NULL,
    changed_by VARCHAR(20),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_txn_logs_transaction ON transaction_status_logs(transaction_id);

CREATE TABLE agents (
    id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL REFERENCES users(id),
    shop_name VARCHAR(255) NOT NULL,
    shop_address TEXT,
    shop_province VARCHAR(100) NOT NULL,
    shop_lat DOUBLE PRECISION,
    shop_lng DOUBLE PRECISION,
    country VARCHAR(5) NOT NULL DEFAULT 'TH',
    agent_type agent_type NOT NULL,
    float_balance_lak BIGINT NOT NULL DEFAULT 0,
    float_balance_thb DOUBLE PRECISION NOT NULL DEFAULT 0,
    float_minimum BIGINT NOT NULL DEFAULT 0,
    float_maximum BIGINT,
    commission_rate DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    commission_total BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    agreement_signed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_country ON agents(country);

CREATE TABLE float_transactions (
    id VARCHAR(24) PRIMARY KEY,
    agent_id VARCHAR(24) NOT NULL REFERENCES agents(id),
    type VARCHAR(20) NOT NULL,
    amount BIGINT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    reference VARCHAR(64),
    method VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_float_txns_agent ON float_transactions(agent_id);

CREATE TABLE treasury_reconciliations (
    id VARCHAR(24) PRIMARY KEY,
    date VARCHAR(10) NOT NULL,
    bank_account_id VARCHAR(50) NOT NULL,
    bank_open_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
    bank_close_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
    bank_total_credits DOUBLE PRECISION NOT NULL DEFAULT 0,
    bank_total_debits DOUBLE PRECISION NOT NULL DEFAULT 0,
    system_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
    difference DOUBLE PRECISION NOT NULL DEFAULT 0,
    difference_reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reconciliations_date ON treasury_reconciliations(date);

CREATE TABLE aml_checks (
    id VARCHAR(24) PRIMARY KEY,
    transaction_ref VARCHAR(64) NOT NULL REFERENCES transactions(transaction_ref),
    check_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'clear',
    flagged_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aml_checks_txn ON aml_checks(transaction_ref);

CREATE TABLE autosends (
    id VARCHAR(24) PRIMARY KEY,
    sender_id VARCHAR(20) NOT NULL REFERENCES users(id),
    recipient_id VARCHAR(20) NOT NULL REFERENCES users(id),
    amount_thb DOUBLE PRECISION NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
    next_send_at TIMESTAMPTZ NOT NULL,
    last_send_at TIMESTAMPTZ,
    payout_method VARCHAR(30) NOT NULL DEFAULT 'bcel_cash',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_autosends_sender ON autosends(sender_id);
CREATE INDEX idx_autosends_next ON autosends(next_send_at) WHERE is_active = TRUE;

COMMIT;
