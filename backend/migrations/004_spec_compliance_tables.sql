BEGIN;

CREATE TABLE sender_profiles (
    user_id VARCHAR(20) PRIMARY KEY REFERENCES users(id),
    thai_id_number VARCHAR(20),
    work_permit_number VARCHAR(30),
    employer_name VARCHAR(200),
    employer_province VARCHAR(100),
    home_province VARCHAR(100),
    referral_code VARCHAR(20) UNIQUE,
    referred_by VARCHAR(20) REFERENCES users(id),
    total_sent_count INT DEFAULT 0,
    total_sent_amount BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recipient_profiles (
    id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(id),
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    district VARCHAR(100),
    village VARCHAR(100),
    preferred_payout VARCHAR(30) DEFAULT 'bcel_cash',
    preferred_agent_id VARCHAR(24) REFERENCES agents(id),
    birth_year VARCHAR(4),
    relationship VARCHAR(30),
    created_by VARCHAR(20) NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(phone, created_by)
);

CREATE TABLE fx_rates (
    id BIGSERIAL PRIMARY KEY,
    from_currency CHAR(3) NOT NULL,
    to_currency CHAR(3) NOT NULL,
    mid_market_rate DECIMAL(10,2) NOT NULL,
    our_rate DECIMAL(10,2) NOT NULL,
    source VARCHAR(30) DEFAULT 'kasikorn',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fx_rates_recorded ON fx_rates(recorded_at);

CREATE TABLE reconciliations (
    id VARCHAR(24) PRIMARY KEY,
    reconciliation_date DATE NOT NULL,
    bank_account_id VARCHAR(50) NOT NULL,
    bank_opening_balance DECIMAL(18,2) DEFAULT 0,
    bank_closing_balance DECIMAL(18,2) DEFAULT 0,
    system_balance DECIMAL(18,2) DEFAULT 0,
    difference DECIMAL(18,2) DEFAULT 0,
    difference_reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reconciliations_date ON reconciliations(reconciliation_date);

COMMIT;
