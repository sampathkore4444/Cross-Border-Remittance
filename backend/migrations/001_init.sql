CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    phone VARCHAR(32) UNIQUE NOT NULL,
    country_code VARCHAR(8) NOT NULL DEFAULT '',
    name VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(32) NOT NULL DEFAULT 'sender',
    kyc_level VARCHAR(32) NOT NULL DEFAULT 'unverified',
    language VARCHAR(8) NOT NULL DEFAULT 'lo',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

CREATE TABLE IF NOT EXISTS kyc_documents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    doc_type VARCHAR(64) NOT NULL,
    doc_number VARCHAR(128) NOT NULL DEFAULT '',
    front_url TEXT NOT NULL DEFAULT '',
    back_url TEXT NOT NULL DEFAULT '',
    selfie_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_documents(user_id);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    transaction_ref VARCHAR(128) UNIQUE NOT NULL,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id),
    source_currency VARCHAR(8) NOT NULL DEFAULT 'THB',
    source_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    exchange_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    mid_market_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    target_currency VARCHAR(8) NOT NULL DEFAULT 'LAK',
    target_amount BIGINT NOT NULL DEFAULT 0,
    recipient_name VARCHAR(255) NOT NULL DEFAULT '',
    recipient_phone VARCHAR(32) NOT NULL DEFAULT '',
    recipient_province VARCHAR(128) NOT NULL DEFAULT '',
    payout_method VARCHAR(32) NOT NULL DEFAULT '',
    payment_method VARCHAR(32) NOT NULL DEFAULT '',
    payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    payout_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    pickup_code VARCHAR(32) NOT NULL DEFAULT '',
    payment_reference VARCHAR(255) NOT NULL DEFAULT '',
    payout_reference VARCHAR(255) NOT NULL DEFAULT '',
    idempotency_key VARCHAR(255) NOT NULL DEFAULT '',
    quoted_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_tx_ref ON transactions(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_tx_pickup ON transactions(pickup_code);
CREATE INDEX IF NOT EXISTS idx_tx_idempotency ON transactions(idempotency_key);

CREATE TABLE IF NOT EXISTS transaction_logs (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(transaction_ref),
    status_from VARCHAR(32) NOT NULL DEFAULT '',
    status_to VARCHAR(32) NOT NULL DEFAULT '',
    changed_by VARCHAR(64) NOT NULL DEFAULT 'system',
    reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_logs_tx ON transaction_logs(transaction_id);

CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(32) NOT NULL DEFAULT '',
    country VARCHAR(8) NOT NULL DEFAULT 'LA',
    province VARCHAR(128) NOT NULL DEFAULT '',
    float_balance_lak BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_country ON agents(country);

CREATE TABLE IF NOT EXISTS float_transactions (
    id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES agents(id),
    type VARCHAR(32) NOT NULL DEFAULT '',
    amount BIGINT NOT NULL DEFAULT 0,
    reference VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_float_agent ON float_transactions(agent_id);

CREATE TABLE IF NOT EXISTS treasury_reconciliations (
    id VARCHAR(64) PRIMARY KEY,
    date VARCHAR(16) NOT NULL UNIQUE,
    bank_account_id VARCHAR(64) NOT NULL DEFAULT '',
    bank_close_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
    system_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recon_date ON treasury_reconciliations(date);

CREATE TABLE IF NOT EXISTS aml_checks (
    id VARCHAR(64) PRIMARY KEY,
    transaction_ref VARCHAR(128) NOT NULL DEFAULT '',
    name VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'clear',
    reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aml_tx ON aml_checks(transaction_ref);

CREATE TABLE IF NOT EXISTS autosends (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    recipient_id VARCHAR(64) NOT NULL DEFAULT '',
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    frequency VARCHAR(32) NOT NULL DEFAULT 'monthly',
    next_send_at TIMESTAMPTZ,
    last_send_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autosend_user ON autosends(user_id);
CREATE INDEX IF NOT EXISTS idx_autosend_next ON autosends(next_send_at);

CREATE TABLE IF NOT EXISTS recipient_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    phone VARCHAR(32) NOT NULL DEFAULT '',
    name VARCHAR(255) NOT NULL DEFAULT '',
    province VARCHAR(128) NOT NULL DEFAULT '',
    relationship VARCHAR(64) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipient_user ON recipient_profiles(user_id);

CREATE TABLE IF NOT EXISTS admin_logs (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NOT NULL DEFAULT '',
    action VARCHAR(64) NOT NULL DEFAULT '',
    target_id VARCHAR(64) NOT NULL DEFAULT '',
    detail TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);

CREATE TABLE IF NOT EXISTS webhook_logs (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL DEFAULT '',
    source VARCHAR(64) NOT NULL DEFAULT '',
    transaction_ref VARCHAR(128) NOT NULL DEFAULT '',
    request_body TEXT NOT NULL DEFAULT '',
    response_status INT NOT NULL DEFAULT 0,
    signature_valid BOOLEAN NOT NULL DEFAULT false,
    error TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tx ON webhook_logs(transaction_ref);

CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
